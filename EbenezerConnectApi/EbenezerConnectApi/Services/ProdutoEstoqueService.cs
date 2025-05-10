using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Services
{
    public class ProdutoEstoqueService : IProdutoEstoqueService
    {
        private readonly ApplicationDbContext _context;

        public ProdutoEstoqueService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProdutoEstoque>> ListarTodos()
        {
            return await _context.ProdutoEstoque
                .Include(p => p.HistoricoPrecos)
                .ToListAsync();
        }

        public async Task<ProdutoEstoque?> ObterPorId(int id)
        {
            return await _context.ProdutoEstoque
                .Include(p => p.HistoricoPrecos)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<bool> Adicionar(ProdutoEstoque produto)
        {
            await _context.ProdutoEstoque.AddAsync(produto);
            await _context.SaveChangesAsync();

            var historico = new PrecoHistoricoProduto
            {
                ProdutoEstoqueId = produto.Id,
                PrecoCompra = produto.PrecoCompraAtual,
                PrecoVenda = produto.PrecoVendaAtual,
                DataInicio = DateTime.UtcNow
            };

            await _context.PrecoHistoricoProduto.AddAsync(historico);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> Atualizar(ProdutoEstoque produto)
        {
            var existente = await _context.ProdutoEstoque.FindAsync(produto.Id);
            if (existente == null) return false;

            bool houveMudancaPreco =
                existente.PrecoCompraAtual != produto.PrecoCompraAtual ||
                existente.PrecoVendaAtual != produto.PrecoVendaAtual;

            existente.Nome = produto.Nome;
            existente.QuantidadeEmEstoque = produto.QuantidadeEmEstoque;
            existente.PrecoCompraAtual = produto.PrecoCompraAtual;
            existente.PrecoVendaAtual = produto.PrecoVendaAtual;

            if (houveMudancaPreco)
            {
                var historico = new PrecoHistoricoProduto
                {
                    ProdutoEstoqueId = produto.Id,
                    PrecoCompra = produto.PrecoCompraAtual,
                    PrecoVenda = produto.PrecoVendaAtual,
                    DataInicio = DateTime.UtcNow
                };

                await _context.PrecoHistoricoProduto.AddAsync(historico);
            }

            _context.ProdutoEstoque.Update(existente);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> Remover(int id)
        {
            var produto = await _context.ProdutoEstoque.FindAsync(id);
            if (produto == null) return false;

            _context.ProdutoEstoque.Remove(produto);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AtualizarPreco(int produtoId, decimal novoPrecoCompra, decimal novoPrecoVenda)
        {
            var produto = await _context.ProdutoEstoque.FindAsync(produtoId);
            if (produto == null) return false;

            produto.PrecoCompraAtual = novoPrecoCompra;
            produto.PrecoVendaAtual = novoPrecoVenda;

            var historico = new PrecoHistoricoProduto
            {
                ProdutoEstoqueId = produtoId,
                PrecoCompra = novoPrecoCompra,
                PrecoVenda = novoPrecoVenda,
                DataInicio = DateTime.UtcNow
            };

            await _context.PrecoHistoricoProduto.AddAsync(historico);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
