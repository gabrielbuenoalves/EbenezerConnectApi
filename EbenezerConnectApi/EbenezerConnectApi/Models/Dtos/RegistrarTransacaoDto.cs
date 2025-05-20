namespace EbenezerConnectApi.Models.Dtos
{
    public class RegistrarTransacaoDto
    {
        public int PessoaId { get; set; }
        public string TipoPagamento { get; set; } // "saldo", "avista", "pendente"
        public List<ItemTransacaoDto> Itens { get; set; } = new();
    }
}
