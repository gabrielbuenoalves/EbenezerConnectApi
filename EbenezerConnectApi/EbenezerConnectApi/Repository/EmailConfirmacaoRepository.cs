using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Repository
{
    public class EmailConfirmacaoRepository : IEmailConfirmacaoRepository
    {
        private readonly ApplicationDbContext _context;

        public EmailConfirmacaoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SalvarToken(EmailConfirmacao confirmacao)
        {
            _context.EmailConfirmacao.Add(confirmacao);
            await _context.SaveChangesAsync();
        }

        public async Task<EmailConfirmacao?> BuscarPorToken(string token)
        {
            return await _context.EmailConfirmacao
                .Include(e => e.Pessoa)
                .FirstOrDefaultAsync(e => e.Token == token);
        }

        public async Task Remover(EmailConfirmacao confirmacao)
        {
            _context.EmailConfirmacao.Remove(confirmacao);
            await _context.SaveChangesAsync();
        }
    }
}
