using AutoMapper;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutoController : ControllerBase
    {
        private readonly IProdutoService _service;
        private readonly IMapper _mapper;

        public ProdutoController(IProdutoService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
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
        [AllowAnonymous]
        public async Task<IActionResult> Post([FromBody] CriarProdutoDto dto)
        {
            
            var produto = _mapper.Map<Produto>(dto);
            await _service.Adicionar(produto);

            var produtoDto = _mapper.Map<ExibirProdutoDto>(produto);
            return CreatedAtAction(nameof(GetPorId), new { id = produto.Id },produtoDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] AtualizarProdutoDto dto)
        {

            var atualizado = await _service.Atualizar(id, dto);
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
