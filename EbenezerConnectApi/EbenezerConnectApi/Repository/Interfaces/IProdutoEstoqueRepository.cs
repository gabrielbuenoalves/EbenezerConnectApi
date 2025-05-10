using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface IProdutoEstoqueRepository
    {
        Task<List<ProdutoEstoque>> ListarTodos();
        Task<ProdutoEstoque?> ObterPorId(int id);
        Task Adicionar(ProdutoEstoque produto);
        Task Atualizar(ProdutoEstoque produto);
        Task Remover(ProdutoEstoque produto);
    }
}
