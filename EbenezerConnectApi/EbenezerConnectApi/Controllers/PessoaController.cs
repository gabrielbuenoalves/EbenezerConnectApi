using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Services;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PessoaController : ControllerBase
    {
        private readonly IPessoaService _pessoaService;

        public PessoaController(IPessoaService pessoaService)
        {
            _pessoaService = pessoaService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Pessoa>>> ObterTodasPessoas()
        {
            var pessoas = await _pessoaService.ObterTodasPessoas();
            return Ok(pessoas);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Pessoa>> ObterPessoaPorId(int id)
        {
            var pessoa = await _pessoaService.ObterPessoaPorId(id);
            if (pessoa == null)
            {
                return NotFound();
            }
            return Ok(pessoa);
        }

        [HttpPost]
        public async Task<ActionResult> AdicionarPessoa([FromBody] Pessoa pessoa)
        {
            await _pessoaService.AdicionarPessoa(pessoa);
            return CreatedAtAction(nameof(ObterPessoaPorId), new { id = pessoa.Id }, pessoa);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> AtualizarPessoa(int id, [FromBody] Pessoa pessoa)
        {
            if (id != pessoa.Id)
            {
                return BadRequest();
            }

            await _pessoaService.AtualizarPessoa(pessoa);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> RemoverPessoa(int id)
        {
            await _pessoaService.RemoverPessoa(id);
            return NoContent();
        }
    }
}
