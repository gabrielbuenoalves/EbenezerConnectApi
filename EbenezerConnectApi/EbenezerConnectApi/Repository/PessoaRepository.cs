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

        public async Task<Pessoa?> BuscarPorEmail(string email)
        {
            return await _context.Pessoa
                .Include(p => p.Quarto)
                .FirstOrDefaultAsync(p => p.Email == email);
        }

        public async Task<Pessoa?> ObterPorId(int id)
        {
            return await _context.Pessoa
                .Include(p => p.Quarto)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<Pessoa>> ObterTodasPessoas()
        {
            return await _context.Pessoa
                .Include(p => p.Quarto)
                .ToListAsync();
        }

        public async Task<List<Pessoa>> ObterPorFuncao(string funcao)
        {
            return await _context.Pessoa
                .Where(p => p.Funcao.ToLower() == funcao.ToLower())
                .Include(p => p.Quarto)
                .ToListAsync();
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

        public async Task RemoverPessoa(int id)
        {
            var pessoa = await _context.Pessoa.FindAsync(id);
            if (pessoa != null)
            {
                _context.Pessoa.Remove(pessoa);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Pessoa?> VerificarSaldoPessoa(int id, string cpf)
        {
            return await _context.Pessoa
                .FirstOrDefaultAsync(p => p.Id == id && p.Cpf == cpf);
        }

        public async Task AdicionarCredito(int id, decimal valor)
        {
            var pessoa = await _context.Pessoa.FindAsync(id);
            if (pessoa != null)
            {
                pessoa.Saldo += (double)valor;
                _context.Pessoa.Update(pessoa);
                await _context.SaveChangesAsync();
            }
        }
    }
}
