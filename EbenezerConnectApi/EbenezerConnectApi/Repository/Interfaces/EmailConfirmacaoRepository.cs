using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface IEmailConfirmacaoRepository
    {
        Task SalvarToken(EmailConfirmacao confirmacao);
        Task<EmailConfirmacao?> BuscarPorToken(string token);
        Task Remover(EmailConfirmacao confirmacao);
    }
}
