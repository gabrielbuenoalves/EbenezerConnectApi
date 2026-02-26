namespace EbenezerConnectApi.Models.Dtos
{
    public class FinanceiroItemDto
    {
        public string ProdutoNome { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }
    }
}
