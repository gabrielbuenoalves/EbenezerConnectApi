using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Repository
{
    public class ProdutoEstoqueRepository : IProdutoEstoqueRepository
    {
        private readonly ApplicationDbContext _context;

        public ProdutoEstoqueRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProdutoEstoque>> ListarTodos() =>
            await _context.ProdutoEstoque.ToListAsync();

        public async Task<ProdutoEstoque?> ObterPorId(int id) =>
            await _context.ProdutoEstoque.FindAsync(id);

        public async Task Adicionar(ProdutoEstoque produto)
        {
            _context.ProdutoEstoque.Add(produto);
            await _context.SaveChangesAsync();
        }

        public async Task Atualizar(ProdutoEstoque produto)
        {
            _context.ProdutoEstoque.Update(produto);
            await _context.SaveChangesAsync();
        }

        public async Task Remover(ProdutoEstoque produto)
        {
            _context.ProdutoEstoque.Remove(produto);
            await _context.SaveChangesAsync();
        }
    }

}
