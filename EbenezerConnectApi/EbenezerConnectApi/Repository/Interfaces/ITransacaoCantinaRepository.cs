using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface ITransacaoCantinaRepository
    {
        Task RegistrarTransacaoCantina(TransacaoCantina transacaoCantina);
    }
}
