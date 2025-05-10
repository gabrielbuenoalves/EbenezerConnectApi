using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutoEstoqueController : ControllerBase
    {
        private readonly IProdutoEstoqueService _service;

        public ProdutoEstoqueController(IProdutoEstoqueService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetTodos() =>
            Ok(await _service.ListarTodos());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPorId(int id)
        {
            var produto = await _service.ObterPorId(id);
            return produto == null ? NotFound() : Ok(produto);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ProdutoEstoque produto)
        {
            await _service.Adicionar(produto);
            return CreatedAtAction(nameof(GetPorId), new { id = produto.Id }, produto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ProdutoEstoque produto)
        {
            if (id != produto.Id)
                return BadRequest();

            var atualizado = await _service.Atualizar(produto);
            return atualizado ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var removido = await _service.Remover(id);
            return removido ? NoContent() : NotFound();
        }
    }
}
