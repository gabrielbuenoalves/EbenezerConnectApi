namespace EbenezerConnectApi.Models.Dtos
{
    public class PessoaResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Funcao { get; set; } = string.Empty;
        public string Cpf { get; set; } = string.Empty;
        public string? Igreja { get; set; }
        public double Saldo { get; set; }
        public string? QuartoNome { get; set; }
    }

}
