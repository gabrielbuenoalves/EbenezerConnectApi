using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Repository.Interfaces
{
    public interface IJwtService
    {
        string GerarToken(Pessoa pessoa);
    }
}
