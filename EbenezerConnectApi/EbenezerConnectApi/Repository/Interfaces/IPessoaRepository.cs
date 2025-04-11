
using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface IPessoaRepository
    {
        Task<Pessoa?> BuscarPorEmail(string email);
        Task<Pessoa?> ObterPorId(int id);
        Task<List<Pessoa>> ObterTodasPessoas();
        Task<List<Pessoa>> ObterPorFuncao(string funcao);
        Task AdicionarPessoa(Pessoa pessoa);
        Task AtualizarPessoa(Pessoa pessoa);
        Task RemoverPessoa(int id);
        Task<Pessoa?> VerificarSaldoPessoa(int id, string cpf);
    }

}
