using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Tests;

public class ConfirmacaoEmailTests
{
    [Fact]
    public void Confirmacao_vai_para_o_email_da_pessoa_cadastrada()
    {
        var pessoa = new Pessoa
        {
            Nome = "Ana",
            Email = "ana@acampamento.test"
        };

        var mensagem = EmailService.MontarConfirmacao(
            pessoa,
            "token-teste",
            "http://localhost:5000",
            "noreply@acampamento.test");

        Assert.Equal("ana@acampamento.test", mensagem.To.Mailboxes.Single().Address);
        Assert.Contains("token-teste", mensagem.TextBody);
    }
}
