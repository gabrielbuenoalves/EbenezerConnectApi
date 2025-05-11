namespace EbenezerConnectApi.Models.Dtos
{
    public class ExibirProdutoDto
    {

        public int Id { get; set; }
        public string Nome { get; set; }
        public int QuantidadeEmEstoque { get; set; }
        public decimal PrecoCompraAtual { get; set; }
        public decimal PrecoVendaAtual { get; set; }
    }
}
