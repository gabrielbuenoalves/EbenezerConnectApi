namespace EbenezerConnectApi.Models.Dtos
{
    public class AtualizarPessoaDto
    {
        public string Nome { get; set; } = string.Empty;
        public int? QuartoId { get; set; }
        // Campos que apenas admin pode atualizar
        public string? Email { get; set; }
        public string? Cpf { get; set; }
        public string? Funcao { get; set; }
    }

}
