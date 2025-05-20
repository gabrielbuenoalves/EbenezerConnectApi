using EbenezerConnectApi.Models;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Services
{
    public class TransacaoCantinaService : ITransacaoCantinaService
    {
        private readonly ApplicationDbContext _context;

        public TransacaoCantinaService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> EfetuarTransacaoAsync(RegistrarTransacaoDto dto)
        {
            var pessoa = await _context.Pessoa.FindAsync(dto.PessoaId);
            if (pessoa == null || dto.Itens == null || !dto.Itens.Any())
                return false;

            var produtosIds = dto.Itens.Select(i => i.ProdutoId).ToList();
            var produtos = await _context.Produto
                .Where(p => produtosIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            var itensTransacao = new List<ItemTransacaoCantina>();
            double total = 0;

            foreach (var itemDto in dto.Itens)
            {
                if (!produtos.TryGetValue(itemDto.ProdutoId, out var produto) || produto.QuantidadeEmEstoque < itemDto.Quantidade)
                    return false;

                produto.QuantidadeEmEstoque -= itemDto.Quantidade;

                var precoVenda = (double)produto.PrecoVendaAtual;
                var precoCompra = (double)produto.PrecoCompraAtual;

                total += precoVenda * itemDto.Quantidade;

                itensTransacao.Add(new ItemTransacaoCantina
                {
                    ProdutoId = itemDto.ProdutoId,
                    Quantidade = itemDto.Quantidade,
                    PrecoVendaUnitario = precoVenda,
                    PrecoCompraUnitario = precoCompra
                });
            }

            switch (dto.TipoPagamento.ToLower())
            {
                case "saldo":
                    pessoa.Saldo -= total;
                    _context.Pessoa.Update(pessoa);
                    break;
                case "avista":
                    // saldo não é alterado
                    break;
                default:
                    return false;
            }

            var transacao = new TransacaoCantina
            {
                PessoaId = dto.PessoaId,
                DataTransacao = DateTime.UtcNow,
                Valor = total,
                Tipo = dto.TipoPagamento,
                Itens = itensTransacao
            };

            await _context.TransacaoCantina.AddAsync(transacao);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
