using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FinanceiroController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FinanceiroController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpGet("historico")]
        public async Task<IActionResult> ObterHistorico()
        {
            var transacoes = await _context.TransacaoCantina
                .Include(t => t.Pessoa)
                .Include(t => t.Itens)
                .ThenInclude(i => i.Produto)
                .ToListAsync();

            var creditos = await _context.AdicaoSaldo
                .Include(c => c.Pessoa)
                .ToListAsync();

            var historico = new List<FinanceiroHistoricoDto>();

            foreach (var t in transacoes)
            {
                historico.Add(new FinanceiroHistoricoDto
                {
                    Id = t.Id,
                    Tipo = "cantina",
                    Data = t.DataTransacao,
                    PessoaId = t.PessoaId,
                    PessoaNome = t.Pessoa.Nome,
                    Valor = (decimal)t.Valor,
                    Pagamento = t.Tipo,
                    Revertida = t.Revertida,
                    DataReversao = t.DataReversao,
                    Itens = t.Itens.Select(i => new FinanceiroItemDto
                    {
                        ProdutoNome = i.Produto?.Nome ?? string.Empty,
                        Quantidade = i.Quantidade,
                        PrecoUnitario = (decimal)i.PrecoVendaUnitario
                    }).ToList()
                });
            }

            foreach (var c in creditos)
            {
                historico.Add(new FinanceiroHistoricoDto
                {
                    Id = c.Id,
                    Tipo = "saldo",
                    Data = c.DataAdicao,
                    PessoaId = c.PessoaId,
                    PessoaNome = c.Pessoa.Nome,
                    Valor = c.Valor,
                    Pagamento = "credito",
                    Revertida = c.Revertida,
                    DataReversao = c.DataReversao,
                    Itens = null
                });
            }

            return Ok(historico.OrderByDescending(h => h.Data));
        }

        [Authorize]
        [HttpPost("reverter")]
        public async Task<IActionResult> Reverter([FromBody] ReverterFinanceiroDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Tipo))
                return BadRequest(new { erro = "Tipo de reversao nao informado." });

            var tipo = dto.Tipo.ToLower();

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (tipo == "cantina")
                {
                    var transacao = await _context.TransacaoCantina
                        .Include(t => t.Pessoa)
                        .Include(t => t.Itens)
                        .ThenInclude(i => i.Produto)
                        .FirstOrDefaultAsync(t => t.Id == dto.Id);

                    if (transacao == null)
                        return NotFound(new { erro = "Transacao nao encontrada." });

                    if (transacao.Revertida)
                        return BadRequest(new { erro = "Transacao ja foi revertida." });

                    foreach (var item in transacao.Itens)
                    {
                        if (item.Produto != null)
                        {
                            item.Produto.QuantidadeEmEstoque += item.Quantidade;
                            _context.Produto.Update(item.Produto);
                        }
                    }

                    if (transacao.Tipo == "saldo")
                    {
                        transacao.Pessoa.Saldo += transacao.Valor;
                        _context.Pessoa.Update(transacao.Pessoa);
                    }

                    transacao.Revertida = true;
                    transacao.DataReversao = DateTimeHelper.NowBrasilia();
                    _context.TransacaoCantina.Update(transacao);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { mensagem = "Transacao revertida com sucesso." });
                }

                if (tipo == "saldo")
                {
                    var credito = await _context.AdicaoSaldo
                        .Include(c => c.Pessoa)
                        .FirstOrDefaultAsync(c => c.Id == dto.Id);

                    if (credito == null)
                        return NotFound(new { erro = "Adicao de saldo nao encontrada." });

                    if (credito.Revertida)
                        return BadRequest(new { erro = "Adicao de saldo ja foi revertida." });

                    credito.Pessoa.Saldo -= (double)credito.Valor;
                    _context.Pessoa.Update(credito.Pessoa);

                    credito.Revertida = true;
                    credito.DataReversao = DateTimeHelper.NowBrasilia();
                    _context.AdicaoSaldo.Update(credito);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { mensagem = "Adicao de saldo revertida com sucesso." });
                }

                return BadRequest(new { erro = "Tipo de reversao invalido." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { erro = "Erro ao reverter: " + ex.Message });
            }
        }

        [Authorize]
        [HttpPost("criar-estorno")]
        public async Task<IActionResult> CriarEstorno([FromBody] ReverterFinanceiroDto dto)
        {
            var credito = await _context.AdicaoSaldo
                .Include(c => c.Pessoa)
                .FirstOrDefaultAsync(c => c.Id == dto.Id && !c.Revertida && c.Valor > 0);

            if (credito == null)
                return NotFound(new { erro = "Credito nao encontrado ou ja estornado." });

            var estorno = new AdicaoSaldo
            {
                PessoaId = credito.PessoaId,
                Valor = -credito.Valor,
                DataAdicao = DateTimeHelper.NowBrasilia(),
                Revertida = false
            };

            credito.Pessoa.Saldo -= (double)credito.Valor;
            _context.Pessoa.Update(credito.Pessoa);
            _context.AdicaoSaldo.Add(estorno);

            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Estorno realizado com sucesso." });
        }

        [Authorize]
        [HttpPost("desfazer-estorno")]
        public async Task<IActionResult> DesfazerEstorno([FromBody] ReverterFinanceiroDto dto)
        {
            var credito = await _context.AdicaoSaldo
                .Include(c => c.Pessoa)
                .FirstOrDefaultAsync(c => c.Id == dto.Id);

            if (credito == null)
                return NotFound(new { erro = "Adicao de saldo nao encontrada." });

            if (!credito.Revertida)
                return BadRequest(new { erro = "Este credito nao esta revertido." });

            credito.Pessoa.Saldo += (double)credito.Valor;
            _context.Pessoa.Update(credito.Pessoa);

            credito.Revertida = false;
            credito.DataReversao = null;
            _context.AdicaoSaldo.Update(credito);

            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Estorno desfeito com sucesso." });
        }
    }
}
