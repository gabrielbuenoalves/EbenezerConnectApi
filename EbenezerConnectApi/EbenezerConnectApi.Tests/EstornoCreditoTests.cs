using EbenezerConnectApi.Controllers;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using Microsoft.AspNetCore.Mvc;

namespace EbenezerConnectApi.Tests;

public class EstornoCreditoTests
{
    [Fact]
    public async Task Nao_estorna_o_mesmo_credito_duas_vezes()
    {
        await using var context = BancoEmMemoria.Criar();
        context.Pessoa.Add(new Pessoa
        {
            Nome = "Ana",
            Cpf = "12345678901",
            Email = "ana@acampamento.test",
            Funcao = "acampante",
            SenhaHash = "hash",
            Saldo = 100,
            EmailConfirmado = true
        });
        await context.SaveChangesAsync();

        var pessoa = context.Pessoa.Single();
        context.AdicaoSaldo.Add(new AdicaoSaldo
        {
            PessoaId = pessoa.Id,
            Valor = 40,
            DataAdicao = new DateTime(2026, 1, 1),
            Revertida = false
        });
        await context.SaveChangesAsync();

        var credito = context.AdicaoSaldo.Single();
        var controller = new FinanceiroController(context);
        var dto = new ReverterFinanceiroDto { Id = credito.Id, Tipo = "saldo" };

        var primeiro = await controller.CriarEstorno(dto);
        var segundo = await controller.CriarEstorno(dto);

        Assert.IsType<OkObjectResult>(primeiro);
        Assert.IsType<NotFoundObjectResult>(segundo);
        Assert.Equal(60d, context.Pessoa.Single().Saldo);
        Assert.True(context.AdicaoSaldo.Single(c => c.Id == credito.Id).Revertida);
    }
}
