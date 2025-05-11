namespace EbenezerConnectApi.Models.Dtos
{
    public class CriarProdutoDto
    {
        public string? Nome { get; set; }
        public int QuantidadeEstoque { get; set; }
        public decimal PrecoVenda { get; set; }
        public decimal PrecoCompra { get; set; }
    }
}
