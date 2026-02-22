namespace EbenezerConnectApi.Models
{
    public class EfetuarCompraResult
    {
        public bool Sucesso { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public double SaldoAtual { get; set; }
    }
}
