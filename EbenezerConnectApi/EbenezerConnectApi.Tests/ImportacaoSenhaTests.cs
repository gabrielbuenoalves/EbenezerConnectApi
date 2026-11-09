using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace EbenezerConnectApi.Tests;

public class ImportacaoSenhaTests
{
    [Fact]
    public async Task Senha_temporaria_da_importacao_nao_copia_o_inicio_do_cpf()
    {
        await using var context = BancoEmMemoria.Criar();
        var pessoas = new PessoaRepository(context);
        var confirmacoes = new EmailConfirmacaoRepository(context);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AppSettings:BaseUrl"] = "http://localhost:5000",
            ["EmailSettings:From"] = "noreply@acampamento.test",
            ["EmailSettings:Password"] = "segredo"
        }).Build();
        var email = new EmailService(config, NullLogger<EmailService>.Instance);
        var usuarios = new UsuarioService(pessoas, confirmacoes, email, NullLogger<UsuarioService>.Instance);
        var importacao = new ImportacaoService(pessoas, usuarios);

        var resultado = await importacao.ImportarPessoasJson(
        [
            new ImportacaoPessoaDto
            {
                Nome = "Ana",
                Cpf = "12345678901",
                Email = "",
                Funcao = "acampante"
            }
        ]);

        Assert.Equal(1, resultado.Importados);
        Assert.DoesNotContain(resultado.Mensagens, m => m.Contains("Senha temporária: 123456", StringComparison.Ordinal));
    }
}
