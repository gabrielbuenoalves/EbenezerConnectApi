using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface ITransacaoCantinaRepository
    {
        Task RegistrarTransacaoAsync(TransacaoCantina transacao);
        Task<TransacaoCantina?> ObterPorIdAsync(int id);
        Task<List<TransacaoCantina>> ListarTodasAsync();
    }
}
