namespace EbenezerConnectApi.Models.Dtos
{
    public class EscalaEventoResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public bool Ativo { get; set; }
        public DateTime CriadoEm { get; set; }
        public List<EscalaEntradaResponseDto> Entradas { get; set; } = new();
    }
}
