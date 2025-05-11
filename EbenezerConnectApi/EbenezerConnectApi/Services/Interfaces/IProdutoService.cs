using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Services.Interfaces
{
    public interface IProdutoService
    {
        Task<List<Produto>> ListarTodos();
        Task<Produto?> ObterPorId(int id);
        Task<bool> Adicionar(Produto produto);
        Task<bool> Atualizar(int id, AtualizarProdutoDto dto);
        Task<bool> Remover(int id);
        Task<bool> AtualizarPreco(int produtoId, decimal novoPrecoCompra, decimal novoPrecoVenda);
    }
}
