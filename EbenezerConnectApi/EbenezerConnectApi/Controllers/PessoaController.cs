using AutoMapper;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Services;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PessoaController : ControllerBase
    {
        private readonly IPessoaService _pessoaService;
        private readonly IImportacaoService _importacaoService;
        private readonly IMapper _mapper;

        public PessoaController(IPessoaService pessoaService, IImportacaoService importacaoService, IMapper mapper)
        {
            _pessoaService = pessoaService;
            _importacaoService = importacaoService;
            _mapper = mapper;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var pessoas = await _pessoaService.ListarTodas();
            var dtos = _mapper.Map<List<PessoaResponseDto>>(pessoas);
            return Ok(dtos);
        }

        [Authorize]
        [HttpGet("funcao/{funcao}")]
        public async Task<IActionResult> ListarPorFuncao(string funcao)
        {
            var pessoas = await _pessoaService.ListarPorFuncao(funcao);
            var dtos = _mapper.Map<List<PessoaResponseDto>>(pessoas);
            return Ok(dtos);
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var pessoa = await _pessoaService.ObterPorId(id);
            if (pessoa == null)
                return NotFound();

            return Ok(_mapper.Map<PessoaResponseDto>(pessoa));
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, [FromBody] AtualizarPessoaDto dto)
        {
            var pessoa = await _pessoaService.ObterPorId(id);
            if (pessoa == null)
                return NotFound();

            // Campos que todos podem atualizar
            pessoa.Nome = dto.Nome;
            if (dto.QuartoId.HasValue)
                pessoa.QuartoId = dto.QuartoId;

            // Verificar se o usuário é admin antes de permitir atualizar campos sensíveis
            var userFuncao = User.Claims.FirstOrDefault(c => c.Type == "funcao")?.Value;
            if (userFuncao == "admin")
            {
                if (!string.IsNullOrEmpty(dto.Email))
                    pessoa.Email = dto.Email;
                if (!string.IsNullOrEmpty(dto.Cpf))
                    pessoa.Cpf = dto.Cpf;
                if (!string.IsNullOrEmpty(dto.Funcao))
                    pessoa.Funcao = dto.Funcao;
            }

            await _pessoaService.AtualizarPessoa(pessoa);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Remover(int id)
        {
            await _pessoaService.RemoverPessoa(id);
            return NoContent();
        }

        [Authorize]
        [HttpPost("creditos")]
        public async Task<IActionResult> AdicionarCreditos([FromBody] AdicionarCreditoDto dto)
        {
            await _pessoaService.AdicionarCredito(dto.PessoaId, dto.Valor);
            return Ok(new { mensagem = "Créditos adicionados com sucesso!", sucesso = true });
        }

        [Authorize(Roles = "admin,conselheiro")]
        [HttpPost("importar-excel")]
        public async Task<IActionResult> ImportarExcel([FromForm] IFormFile arquivo)
        {
            Console.WriteLine("[PessoaController] Requisição de importação recebida");
            
            if (arquivo == null || arquivo.Length == 0)
            {
                Console.WriteLine("[PessoaController] Erro: Arquivo vazio ou nulo");
                return BadRequest(new { mensagem = "Nenhum arquivo foi enviado." });
            }

            Console.WriteLine($"[PessoaController] Arquivo: {arquivo.FileName}, Tamanho: {arquivo.Length} bytes");

            if (!arquivo.FileName.EndsWith(".xlsx") && !arquivo.FileName.EndsWith(".xls"))
            {
                Console.WriteLine("[PessoaController] Erro: Formato inválido");
                return BadRequest(new { mensagem = "Formato de arquivo inválido. Apenas arquivos Excel (.xlsx, .xls) são aceitos." });
            }

            try
            {
                Console.WriteLine("[PessoaController] Abrindo stream do arquivo...");
                using var stream = arquivo.OpenReadStream();
                
                Console.WriteLine("[PessoaController] Chamando ImportarPessoasExcel...");
                var resultado = await _importacaoService.ImportarPessoasExcel(stream);
                
                Console.WriteLine($"[PessoaController] Importação concluída. Importados: {resultado.Importados}, Erros: {resultado.Erros}");
                Console.WriteLine($"[PessoaController] Enviando resposta JSON: {System.Text.Json.JsonSerializer.Serialize(resultado)}");

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PessoaController] EXCEÇÃO: {ex.GetType().Name} - {ex.Message}");
                Console.WriteLine($"[PessoaController] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { mensagem = $"Erro ao processar arquivo: {ex.Message}" });
            }
        }

        [Authorize(Roles = "admin,conselheiro")]
        [HttpPost("importar-json")]
        public async Task<IActionResult> ImportarJson([FromBody] List<ImportacaoPessoaDto> dados)
        {
            if (dados == null || dados.Count == 0)
                return BadRequest(new { mensagem = "Nenhum dado foi enviado." });

            try
            {
                var resultado = await _importacaoService.ImportarPessoasJson(dados);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensagem = $"Erro ao processar dados: {ex.Message}" });
            }
        }
    }
}
