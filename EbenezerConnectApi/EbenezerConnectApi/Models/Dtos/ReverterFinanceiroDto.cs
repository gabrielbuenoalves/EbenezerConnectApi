namespace EbenezerConnectApi.Models.Dtos
{
    public class ReverterFinanceiroDto
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = string.Empty; // cantina | saldo
        public string? Motivo { get; set; }
    }
}
