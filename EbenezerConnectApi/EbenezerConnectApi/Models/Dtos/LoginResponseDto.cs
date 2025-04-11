namespace EbenezerConnectApi.Models.Dtos
{
    public class LoginResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Funcao { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }


}
