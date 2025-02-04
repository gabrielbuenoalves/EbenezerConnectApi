using EbenezerConnectApi.Models;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Services
{
    public class TransacaoCantinaService : ITransacaoCantinaService
    {
        private readonly ITransacaoCantinaRepository _transacaoCantinaRepository;
        private readonly IPessoaRepository _pessoaRepository;
        public TransacaoCantinaService(ITransacaoCantinaRepository transacaoCantinaRepository, IPessoaRepository pessoaRepository) { 
        
            _transacaoCantinaRepository = transacaoCantinaRepository;
            _pessoaRepository = pessoaRepository;
        }
        
        public async Task<EfetuarCompraResult> EfetuarCompra(int pessoaId,double valorCompra,string descricao)
        {
            //verificar se a pessoa existe
            var pessoa = await _pessoaRepository.ObterPorId(pessoaId);
            if(pessoa == null)
            {
                return new EfetuarCompraResult
                {
                    Sucesso = false,
                    Mensagem = "Pessoa não encontrada, favor verificar cadastro."
                };
            }
            // 2. Verificar se o saldo é suficiente
            if (pessoa.Saldo < valorCompra)
            {
                return new EfetuarCompraResult
                {
                    Sucesso = false,
                    Mensagem = "Saldo insuficiente para realizar a compra."
                };
            }
            // 3. Registrar a transação de compra
            var transacao = new TransacaoCantina
            {
                PessoaId = pessoaId,
                DataTransacao = DateTime.Now,
                Valor = valorCompra,
                Descricao = descricao,
                Tipo = "Compra"
            };
            _transacaoCantinaRepository.RegistrarTransacaoCantina(transacao);

            // 4. Atualizar o saldo da pessoa
            pessoa.Saldo -= valorCompra;
            _pessoaRepository.AtualizarPessoa(pessoa);

            return new EfetuarCompraResult
            {
                Sucesso = true,
                Mensagem = "Compra realizada com sucesso.",
                SaldoAtual = pessoa.Saldo
            };
        }
    }
}
