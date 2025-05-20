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
            var sucesso = await _service.EfetuarTransacaoAsync(dto);
            return sucesso ? Ok("Transação registrada com sucesso.") : BadRequest("Erro ao registrar transação.");
        }
    }
}
