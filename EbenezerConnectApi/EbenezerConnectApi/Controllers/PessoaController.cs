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
        private readonly IMapper _mapper;

        public PessoaController(IPessoaService pessoaService, IMapper mapper)
        {
            _pessoaService = pessoaService;
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

    }
}
