using AutoMapper;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EscalasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public EscalasController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var escalas = await _context.EscalaEvento
                .Include(e => e.Entradas)
                .Where(e => e.Ativo)
                .OrderByDescending(e => e.CriadoEm)
                .ToListAsync();

            return Ok(_mapper.Map<List<EscalaEventoResponseDto>>(escalas));
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var escala = await _context.EscalaEvento
                .Include(e => e.Entradas)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (escala == null)
                return NotFound(new { erro = "Escala não encontrada." });

            return Ok(_mapper.Map<EscalaEventoResponseDto>(escala));
        }

        [Authorize(Roles = "admin")]
        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] CriarEscalaEventoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (dto.DataInicio.HasValue && dto.DataFim.HasValue && dto.DataFim.Value < dto.DataInicio.Value)
            {
                return BadRequest(new { erro = "A data/hora final deve ser maior que a inicial." });
            }

            var escala = _mapper.Map<EscalaEvento>(dto);
            if (escala.DataInicio.HasValue)
            {
                escala.DataInicio = DateTime.SpecifyKind(escala.DataInicio.Value, DateTimeKind.Unspecified);
            }

            if (escala.DataFim.HasValue)
            {
                escala.DataFim = DateTime.SpecifyKind(escala.DataFim.Value, DateTimeKind.Unspecified);
            }

            escala.CriadoEm = DateTime.UtcNow;
            _context.EscalaEvento.Add(escala);
            try
            {
                await _context.SaveChangesAsync();
                return Ok(_mapper.Map<EscalaEventoResponseDto>(escala));
            }
            catch (DbUpdateException ex)
            {
                var detalhes = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { erro = $"Erro ao criar escala: {detalhes}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = $"Erro ao criar escala: {ex.Message}" });
            }
        }

        [Authorize(Roles = "admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, [FromBody] CriarEscalaEventoDto dto)
        {
            var escala = await _context.EscalaEvento.FindAsync(id);
            if (escala == null)
                return NotFound(new { erro = "Escala não encontrada." });

            escala.Nome = dto.Nome;
            escala.DataInicio = dto.DataInicio;
            escala.DataFim = dto.DataFim;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var escala = await _context.EscalaEvento
                .Include(e => e.Entradas)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (escala == null)
                return NotFound(new { erro = "Escala não encontrada." });

            _context.EscalaEvento.Remove(escala);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "admin")]
        [HttpPost("{id}/entradas")]
        public async Task<IActionResult> AdicionarEntrada(int id, [FromBody] CriarEscalaEntradaDto dto)
        {
            var escala = await _context.EscalaEvento.FindAsync(id);
            if (escala == null)
                return NotFound(new { erro = "Escala não encontrada." });

            if (!TimeSpan.TryParse(dto.HorarioInicio, out var novoHorarioInicio) ||
                !TimeSpan.TryParse(dto.HorarioFim, out var novoHorarioFim))
            {
                return BadRequest(new { erro = "Horário inválido. Use o formato HH:mm." });
            }

            if (novoHorarioFim <= novoHorarioInicio)
            {
                return BadRequest(new { erro = "O horário final deve ser maior que o inicial." });
            }

            var nomesConselheiros = dto.NomesConselheiros
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Select(n => n.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (nomesConselheiros.Count == 0 && !string.IsNullOrWhiteSpace(dto.NomeConselheiro))
            {
                nomesConselheiros.Add(dto.NomeConselheiro.Trim());
            }

            if (nomesConselheiros.Count == 0)
            {
                return BadRequest(new { erro = "Selecione pelo menos um conselheiro." });
            }

            var nomesConselheirosConcatenado = string.Join(", ", nomesConselheiros);
            if (nomesConselheirosConcatenado.Length > 100)
            {
                return BadRequest(new { erro = "Nomes dos conselheiros excedem o limite de 100 caracteres." });
            }

            var entradasMesmoDia = await _context.EscalaEntrada
                .Where(e => e.EscalaEventoId == id && e.Dia == dto.Dia)
                .ToListAsync();

            foreach (var entradaExistente in entradasMesmoDia)
            {
                if (!TimeSpan.TryParse(entradaExistente.HorarioInicio, out var horarioInicioExistente) ||
                    !TimeSpan.TryParse(entradaExistente.HorarioFim, out var horarioFimExistente))
                {
                    continue;
                }

                if (!HorariosConflitam(novoHorarioInicio, novoHorarioFim, horarioInicioExistente, horarioFimExistente))
                {
                    continue;
                }

                var conselheirosExistentes = ExtrairConselheiros(entradaExistente.NomeConselheiro);
                var conselheiroEmConflito = nomesConselheiros
                    .FirstOrDefault(nome => conselheirosExistentes.Contains(nome, StringComparer.OrdinalIgnoreCase));

                if (conselheiroEmConflito != null)
                {
                    return BadRequest(new
                    {
                        erro = $"Conflito de agenda: {conselheiroEmConflito} já está escalado em {entradaExistente.Atividade} ({entradaExistente.HorarioInicio}-{entradaExistente.HorarioFim}) no dia {dto.Dia}."
                    });
                }
            }

            var entrada = _mapper.Map<EscalaEntrada>(dto);
            entrada.NomeConselheiro = nomesConselheirosConcatenado;
            entrada.EscalaEventoId = id;
            _context.EscalaEntrada.Add(entrada);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<EscalaEntradaResponseDto>(entrada));
        }

        private static bool HorariosConflitam(TimeSpan inicioA, TimeSpan fimA, TimeSpan inicioB, TimeSpan fimB)
        {
            return inicioA < fimB && inicioB < fimA;
        }

        private static List<string> ExtrairConselheiros(string nomesConselheiros)
        {
            return nomesConselheiros
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(nome => nome.Trim())
                .Where(nome => !string.IsNullOrWhiteSpace(nome))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("{id}/entradas/{entradaId}")]
        public async Task<IActionResult> RemoverEntrada(int id, int entradaId)
        {
            var entrada = await _context.EscalaEntrada
                .FirstOrDefaultAsync(e => e.Id == entradaId && e.EscalaEventoId == id);

            if (entrada == null)
                return NotFound(new { erro = "Entrada não encontrada." });

            _context.EscalaEntrada.Remove(entrada);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
