namespace EbenezerConnectApi.Models.Dtos
{
    public class PessoaResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Funcao { get; set; }
        public string Cpf { get; set; }
        public string? Igreja { get; set; }
        public double Saldo { get; set; }
        public string? QuartoNome { get; set; }
    }

}
