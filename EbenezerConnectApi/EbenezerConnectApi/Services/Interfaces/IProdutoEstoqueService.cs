using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Services.Interfaces
{
    public interface IProdutoEstoqueService
    {
        Task<List<ProdutoEstoque>> ListarTodos();
        Task<ProdutoEstoque?> ObterPorId(int id);
        Task<bool> Adicionar(ProdutoEstoque produto);
        Task<bool> Atualizar(ProdutoEstoque produto);
        Task<bool> Remover(int id);
        Task<bool> AtualizarPreco(int produtoId, decimal novoPrecoCompra, decimal novoPrecoVenda);
    }
}
