using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Services.Interfaces
{
    public interface IPessoaService
    {
        Task<List<Pessoa>> ListarTodas();
        Task<List<Pessoa>> ListarPorFuncao(string funcao);
        Task<Pessoa?> ObterPorId(int id);
        Task AtualizarPessoa(Pessoa pessoa);
        Task RemoverPessoa(int id);
        Task AdicionarCredito(int id, decimal valor);
     
    }

}
