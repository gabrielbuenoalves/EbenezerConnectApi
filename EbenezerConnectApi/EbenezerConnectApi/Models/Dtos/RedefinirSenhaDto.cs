namespace EbenezerConnectApi.Models.Dtos
{
    public class RedefinirSenhaDto
    {
        public string Email { get; set; } = string.Empty;
        public string SenhaTemporaria { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}
