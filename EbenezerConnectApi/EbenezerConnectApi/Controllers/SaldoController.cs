using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class SaldoController : ControllerBase
    {
        private readonly IPessoaRepository _pessoaRepository;

        public SaldoController(IPessoaRepository pessoaRepository)
        {
            _pessoaRepository = pessoaRepository;
        }

        [HttpGet("consultar")]
        public async Task<IActionResult> Consultar([FromQuery] string? cpf, [FromQuery] string? nome)
        {
            if (string.IsNullOrWhiteSpace(cpf) && string.IsNullOrWhiteSpace(nome))
                return BadRequest(new { erro = "Informe cpf ou nome para consulta." });

            if (!string.IsNullOrWhiteSpace(cpf))
            {
                var pessoa = await _pessoaRepository.BuscarPorCpf(cpf);
                if (pessoa == null)
                    return NotFound(new { erro = "Pessoa não encontrada." });
                return Ok(MapToDto(pessoa));
            }
            else
            {
                var pessoas = await _pessoaRepository.BuscarPorNome(nome!);
                return Ok(pessoas.Select(MapToDto));
            }
        }

        private static ConsultaSaldoResponseDto MapToDto(Pessoa p) => new()
        {
            Nome = p.Nome,
            Saldo = p.Saldo,
            QuartoNome = p.Quarto?.Nome
        };
    }
}
