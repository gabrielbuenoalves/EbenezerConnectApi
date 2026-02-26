namespace EbenezerConnectApi.Models.Dtos
{
    public class FinanceiroHistoricoDto
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = string.Empty; // cantina | saldo
        public DateTime Data { get; set; }
        public int PessoaId { get; set; }
        public string PessoaNome { get; set; } = string.Empty;
        public decimal Valor { get; set; }
        public string Pagamento { get; set; } = string.Empty;
        public bool Revertida { get; set; }
        public DateTime? DataReversao { get; set; }
        public List<FinanceiroItemDto>? Itens { get; set; }
    }
}
