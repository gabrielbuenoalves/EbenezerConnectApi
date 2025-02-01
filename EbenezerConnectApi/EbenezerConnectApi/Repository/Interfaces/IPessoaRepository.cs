
using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface IPessoaRepository
    {
        Task<List<Pessoa>> ObterTodasPessoas();
        Task<Pessoa> ObterPorId(int id);
        Task AdicionarPessoa(Pessoa pessoa);
        Task AtualizarPessoa(Pessoa pessoa);
        Task RemoverPessoa(int id);
        
    }
}
