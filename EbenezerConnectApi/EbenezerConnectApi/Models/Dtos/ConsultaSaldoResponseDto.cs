namespace EbenezerConnectApi.Models.Dtos
{
    public class ConsultaSaldoResponseDto
    {
        public string Nome { get; set; } = string.Empty;
        public double Saldo { get; set; }
        public string? QuartoNome { get; set; }
    }
}
