namespace EbenezerConnectApi.Models.Dtos
{
    public class AtualizarPessoaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Igreja { get; set; }
        public int? QuartoId { get; set; }
    }

}
