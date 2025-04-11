namespace EbenezerConnectApi.Models.Dtos
{
    public class RegisterRequestDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public string ConfirmarSenha { get; set; } = string.Empty;
        public string Funcao { get; set; } = string.Empty;
        public string Cpf { get; set; } = string.Empty;
        public string? Igreja { get; set; }
        public int? QuartoId { get; set; }
    }


}
