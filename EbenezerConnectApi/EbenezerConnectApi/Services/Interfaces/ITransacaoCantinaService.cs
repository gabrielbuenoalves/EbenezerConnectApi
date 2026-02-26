using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Services.Interfaces
{
    public interface ITransacaoCantinaService
    {
        Task<(bool sucesso, string mensagem)> EfetuarTransacaoAsync(RegistrarTransacaoDto dto);
    }
}
