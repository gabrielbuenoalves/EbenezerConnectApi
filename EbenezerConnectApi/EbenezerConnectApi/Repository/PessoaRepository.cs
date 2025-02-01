using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Repository
{
    public class PessoaRepository : IPessoaRepository
    {
        private readonly ApplicationDbContext _context;

        public PessoaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AdicionarPessoa(Pessoa pessoa)
        {
            _context.Pessoa.Add(pessoa);
            await _context.SaveChangesAsync();
        }

        public async Task AtualizarPessoa(Pessoa pessoa)
        {
            _context.Entry(pessoa).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task<Pessoa> ObterPorId(int id)
        {
            return await _context.Pessoa.FindAsync(id);
        }

        public async Task<List<Pessoa>> ObterTodasPessoas()
        {
            return await _context.Pessoa.ToListAsync();
        }

        public async Task RemoverPessoa(int id)
        {
            var pessoa = await _context.Pessoa.FindAsync(id);
            if (pessoa != null)
            {
                _context.Pessoa.Remove(pessoa);
                await _context.SaveChangesAsync();
            }
        }
    }
}
