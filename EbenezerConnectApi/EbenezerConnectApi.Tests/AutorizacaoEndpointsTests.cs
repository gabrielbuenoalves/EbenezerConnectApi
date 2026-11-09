using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EbenezerConnectApi.Tests;

public class AutorizacaoEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AutorizacaoEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Registrar_venda_sem_token_retorna_nao_autorizado()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/TransacaoCantina/registrar", new
        {
            PessoaId = 1,
            TipoPagamento = "avista",
            Itens = new[] { new { ProdutoId = 1, Quantidade = 1 } }
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Criar_produto_sem_token_retorna_nao_autorizado()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/Produto", new
        {
            Nome = "Agua",
            QuantidadeEstoque = 1,
            PrecoCompra = 1,
            PrecoVenda = 2
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Consulta_de_saldo_sem_token_nao_exige_login()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Saldo/consultar");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Rota_de_desenvolvimento_fica_indisponivel_em_producao()
    {
        var factory = _factory.WithWebHostBuilder(builder => builder.UseEnvironment("Production"));
        var client = factory.CreateClient();

        var response = await client.PostAsync("/api/Auth/dev/create-admin", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
