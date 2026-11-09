using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Services;

namespace EbenezerConnectApi.Tests;

public class VendaSaldoTests
{
    [Fact]
    public async Task Recusa_venda_em_saldo_quando_o_saldo_nao_cobre_o_total_e_mantem_o_estoque()
    {
        await using var context = BancoEmMemoria.Criar();
        var pessoa = await PessoaComSaldo(context, 10);
        var produto = await Produto(context, estoque: 5, precoVenda: 20);
        var service = new TransacaoCantinaService(context);

        var (sucesso, mensagem) = await service.EfetuarTransacaoAsync(new RegistrarTransacaoDto
        {
            PessoaId = pessoa.Id,
            TipoPagamento = "saldo",
            Itens = [new ItemTransacaoDto { ProdutoId = produto.Id, Quantidade = 1 }]
        });

        Assert.False(sucesso);
        Assert.Contains("insuficiente", mensagem, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(5, context.Produto.Single().QuantidadeEmEstoque);
        Assert.Equal(10d, context.Pessoa.Single().Saldo);
        Assert.Empty(context.TransacaoCantina);
    }

    [Fact]
    public async Task Debita_saldo_e_estoque_quando_o_saldo_cobre_a_venda()
    {
        await using var context = BancoEmMemoria.Criar();
        var pessoa = await PessoaComSaldo(context, 30);
        var produto = await Produto(context, estoque: 5, precoVenda: 20);
        var service = new TransacaoCantinaService(context);

        var (sucesso, _) = await service.EfetuarTransacaoAsync(new RegistrarTransacaoDto
        {
            PessoaId = pessoa.Id,
            TipoPagamento = "saldo",
            Itens = [new ItemTransacaoDto { ProdutoId = produto.Id, Quantidade = 1 }]
        });

        Assert.True(sucesso);
        Assert.Equal(10d, context.Pessoa.Single().Saldo);
        Assert.Equal(4, context.Produto.Single().QuantidadeEmEstoque);
    }

    private static async Task<Pessoa> PessoaComSaldo(Repository.ApplicationDbContext context, double saldo)
    {
        var pessoa = new Pessoa
        {
            Nome = "Ana",
            Cpf = "12345678901",
            Email = "ana@acampamento.test",
            Funcao = "acampante",
            SenhaHash = "hash",
            Saldo = saldo,
            EmailConfirmado = true
        };
        context.Pessoa.Add(pessoa);
        await context.SaveChangesAsync();
        return pessoa;
    }

    private static async Task<Produto> Produto(Repository.ApplicationDbContext context, int estoque, decimal precoVenda)
    {
        var produto = new Produto
        {
            Nome = "Agua",
            QuantidadeEmEstoque = estoque,
            PrecoCompraAtual = 5,
            PrecoVendaAtual = precoVenda
        };
        context.Produto.Add(produto);
        await context.SaveChangesAsync();
        return produto;
    }
}
