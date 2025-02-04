using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;

namespace EbenezerConnectApi.Repository
{
    public class TransacaoCantinaRepository : ITransacaoCantinaRepository
    {
        private readonly ApplicationDbContext _context;

        public TransacaoCantinaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task RegistrarTransacaoCantina(TransacaoCantina transacaoCantina)
        {
            _context.Add(transacaoCantina);
            await _context.SaveChangesAsync();
        }
    }
}
