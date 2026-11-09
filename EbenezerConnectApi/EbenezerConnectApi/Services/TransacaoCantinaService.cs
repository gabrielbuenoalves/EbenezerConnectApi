using EbenezerConnectApi.Models;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using EbenezerConnectApi.Helpers;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using System.Data;

namespace EbenezerConnectApi.Services
{
    public class TransacaoCantinaService : ITransacaoCantinaService
    {
        private readonly ApplicationDbContext _context;

        public TransacaoCantinaService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(bool sucesso, string mensagem)> EfetuarTransacaoAsync(RegistrarTransacaoDto dto)
        {
            if (dto.Itens == null || !dto.Itens.Any())
                return (false, "Nenhum item foi adicionado à transação.");

            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            
            try
            {
                var pessoa = await _context.Pessoa.FindAsync(dto.PessoaId);
                if (pessoa == null)
                    return (false, "Pessoa não encontrada.");

                var produtosIds = dto.Itens.Select(i => i.ProdutoId).ToList();
                var produtos = await _context.Produto
                    .Where(p => produtosIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                var itensTransacao = new List<ItemTransacaoCantina>();
                double total = 0;

                var quantidadesPorProduto = dto.Itens
                    .GroupBy(i => i.ProdutoId)
                    .Select(g => new { ProdutoId = g.Key, Quantidade = g.Sum(x => x.Quantidade) })
                    .ToList();

                foreach (var itemDto in dto.Itens)
                {
                    if (!produtos.TryGetValue(itemDto.ProdutoId, out var produto))
                        return (false, $"Produto com ID {itemDto.ProdutoId} não encontrado.");

                    var precoVenda = (double)produto.PrecoVendaAtual;
                    var precoCompra = (double)produto.PrecoCompraAtual;

                    total += precoVenda * itemDto.Quantidade;

                    itensTransacao.Add(new ItemTransacaoCantina
                    {
                        ProdutoId = itemDto.ProdutoId,
                        Quantidade = itemDto.Quantidade,
                        PrecoVendaUnitario = precoVenda,
                        PrecoCompraUnitario = precoCompra
                    });
                }

                var tipoPagamento = dto.TipoPagamento.ToLower();
                if (tipoPagamento != "saldo" && tipoPagamento != "avista")
                    return (false, "Tipo de pagamento inválido.");

                if (tipoPagamento == "saldo" && pessoa.Saldo < total)
                    return (false, "Saldo insuficiente.");

                foreach (var grupo in quantidadesPorProduto)
                {
                    if (!produtos.TryGetValue(grupo.ProdutoId, out var produto))
                        return (false, $"Produto com ID {grupo.ProdutoId} não encontrado.");

                    var (estoqueOk, erroEstoque) = await BaixarEstoqueAsync(grupo.ProdutoId, grupo.Quantidade, produto.Nome);
                    if (!estoqueOk)
                        return (false, erroEstoque!);
                }

                if (tipoPagamento == "saldo" && !await DebitarSaldoAsync(dto.PessoaId, total))
                    return (false, "Saldo insuficiente.");

                var transacao = new TransacaoCantina
                {
                    PessoaId = dto.PessoaId,
                    DataTransacao = DateTimeHelper.NowBrasilia(),
                    Valor = total,
                    Tipo = tipoPagamento,
                    Itens = itensTransacao
                };

                await _context.TransacaoCantina.AddAsync(transacao);
                await _context.SaveChangesAsync();
                
                // Commit apenas se tudo passou
                await transaction.CommitAsync();
                return (true, "Transação registrada com sucesso.");
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Erro ao atualizar produtos: {ex.InnerException?.Message}");
            }
            catch (MySqlException ex) when (ex.Number == 1213 || ex.Number == 1205)
            {
                await transaction.RollbackAsync();
                return (false, "Conflito de concorrência detectado. Tente novamente.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Erro ao processar transação: {ex.Message}");
            }
        }

        private bool UsaAtualizacaoAtomicaMySql()
        {
            return _context.Database.ProviderName?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true;
        }

        private async Task<(bool ok, string? erro)> BaixarEstoqueAsync(int produtoId, int quantidade, string nomeProduto)
        {
            if (UsaAtualizacaoAtomicaMySql())
            {
                var linhasAfetadas = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Produto SET QuantidadeEmEstoque = QuantidadeEmEstoque - {quantidade} WHERE Id = {produtoId} AND QuantidadeEmEstoque >= {quantidade}");

                if (linhasAfetadas > 0)
                    return (true, null);

                var estoqueAtual = await _context.Produto
                    .Where(p => p.Id == produtoId)
                    .Select(p => p.QuantidadeEmEstoque)
                    .FirstOrDefaultAsync();

                return (false, $"Estoque insuficiente para {nomeProduto}. Disponível: {estoqueAtual}");
            }

            var produto = await _context.Produto.FirstAsync(p => p.Id == produtoId);
            if (produto.QuantidadeEmEstoque < quantidade)
                return (false, $"Estoque insuficiente para {nomeProduto}. Disponível: {produto.QuantidadeEmEstoque}");

            produto.QuantidadeEmEstoque -= quantidade;
            return (true, null);
        }

        private async Task<bool> DebitarSaldoAsync(int pessoaId, double total)
        {
            if (UsaAtualizacaoAtomicaMySql())
            {
                var linhasAfetadas = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Pessoa SET Saldo = Saldo - {total} WHERE Id = {pessoaId} AND Saldo >= {total}");

                return linhasAfetadas > 0;
            }

            var pessoa = await _context.Pessoa.FirstAsync(p => p.Id == pessoaId);
            if (pessoa.Saldo < total)
                return false;

            pessoa.Saldo -= total;
            return true;
        }
    }
}
