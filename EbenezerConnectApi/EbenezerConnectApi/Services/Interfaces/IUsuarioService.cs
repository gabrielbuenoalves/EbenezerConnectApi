using EbenezerConnectApi.Models.Entities;

public interface IUsuarioService
{
    Task Cadastrar(Pessoa pessoa, string senha);
    Task<Pessoa?> Autenticar(string email, string senha);
}
