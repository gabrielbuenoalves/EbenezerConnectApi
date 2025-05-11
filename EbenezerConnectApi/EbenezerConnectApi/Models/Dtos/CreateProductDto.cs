namespace EbenezerConnectApi.Models.Dtos
{
    public class CreateProductDto
    {
        public string? Nome { get; set; }
        public int QuantidadeEstoque { get; set; }
        public decimal PrecoVenda { get; set; }
        public decimal PrecoCompra { get; set; }
    }
}
