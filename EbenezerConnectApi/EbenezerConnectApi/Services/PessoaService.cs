using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;

namespace EbenezerConnectApi.Services
{
    using EbenezerConnectApi.Models.Entities;
    using EbenezerConnectApi.Repository.Interfaces;
    using EbenezerConnectApi.Services.Interfaces;

    public class PessoaService : IPessoaService
    {
        private readonly IPessoaRepository _pessoaRepository;

        public PessoaService(IPessoaRepository pessoaRepository)
        {
            _pessoaRepository = pessoaRepository;
        }

        public async Task<List<Pessoa>> ListarTodas()
        {
            return await _pessoaRepository.ObterTodasPessoas();
        }

        public async Task<List<Pessoa>> ListarPorFuncao(string funcao)
        {
            return await _pessoaRepository.ObterPorFuncao(funcao);
        }

        public async Task<Pessoa?> ObterPorId(int id)
        {
            return await _pessoaRepository.ObterPorId(id);
        }

        public async Task AtualizarPessoa(Pessoa pessoa)
        {
            await _pessoaRepository.AtualizarPessoa(pessoa);
        }

        public async Task RemoverPessoa(int id)
        {
            await _pessoaRepository.RemoverPessoa(id);
        }

        public async Task AdicionarCredito(int id, decimal valor)
        {
            await _pessoaRepository.AdicionarCredito(id, valor);
        }
    }
}