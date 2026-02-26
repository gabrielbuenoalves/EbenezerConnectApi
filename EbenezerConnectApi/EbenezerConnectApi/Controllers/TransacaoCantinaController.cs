using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransacaoCantinaController : ControllerBase
    {
        private readonly ITransacaoCantinaService _service;

        public TransacaoCantinaController(ITransacaoCantinaService service)
        {
            _service = service;
        }

    [HttpPost("registrar")]
    public async Task<IActionResult> RegistrarTransacao([FromBody] RegistrarTransacaoDto dto)
    {
        try
        {
            var (sucesso, mensagem) = await _service.EfetuarTransacaoAsync(dto);
            
            if (!sucesso)
                return BadRequest(new { erro = mensagem });
            
            return Ok(new { mensagem = "Transação registrada com sucesso." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { erro = "Erro ao processar transação: " + ex.Message });
        }
    }
    }
}
