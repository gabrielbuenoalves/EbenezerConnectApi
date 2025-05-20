using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Repository
{
    public class TransacaoCantinaRepository : ITransacaoCantinaRepository
    {
        private readonly ApplicationDbContext _context;

        public TransacaoCantinaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task RegistrarTransacaoAsync(TransacaoCantina transacao)
        {
            _context.TransacaoCantina.Add(transacao);
            await _context.SaveChangesAsync();
        }

        public async Task<TransacaoCantina?> ObterPorIdAsync(int id)
        {
            return await _context.TransacaoCantina
                .Include(t => t.Itens)
                .ThenInclude(i => i.Produto)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<List<TransacaoCantina>> ListarTodasAsync()
        {
            return await _context.TransacaoCantina
                .Include(t => t.Itens)
                .ThenInclude(i => i.Produto)
                .ToListAsync();
        }
    }
}
