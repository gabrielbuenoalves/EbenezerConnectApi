using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface IProdutoRepository
    {
        Task<List<Produto>> ListarTodos();
        Task<Produto?> ObterPorId(int id);
        Task Adicionar(Produto produto);
        Task Atualizar(Produto produto);
        Task Remover(Produto produto);
    }
}
