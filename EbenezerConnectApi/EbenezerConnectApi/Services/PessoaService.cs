using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;

namespace EbenezerConnectApi.Services
{
    public class PessoaService : IPessoaService
    {
        private readonly IPessoaRepository _pessoaRepository;

        public PessoaService(IPessoaRepository pessoaRepository)
        {
            _pessoaRepository = pessoaRepository;
        }

        public async Task<List<Pessoa>> ObterTodasPessoas()
        {
            return await _pessoaRepository.ObterTodasPessoas();
        }

        public async Task<Pessoa> ObterPessoaPorId(int id)
        {
            return await _pessoaRepository.ObterPorId(id);
        }

        public async Task AdicionarPessoa(Pessoa pessoa)
        {
            await _pessoaRepository.AdicionarPessoa(pessoa);
        }

        public async Task AtualizarPessoa(Pessoa pessoa)
        {
            await _pessoaRepository.AtualizarPessoa(pessoa);
        }

        public async Task RemoverPessoa(int id)
        {
            await _pessoaRepository.RemoverPessoa(id);
        }
        public async Task<Pessoa> VerificarSaldoPessoa(int id, string cpf)
        {
            return await _pessoaRepository.VerificarSaldoPessoa(id, cpf);
        }
    }
}
