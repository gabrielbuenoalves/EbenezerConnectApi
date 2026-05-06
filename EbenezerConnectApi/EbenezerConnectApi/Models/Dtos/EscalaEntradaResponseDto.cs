namespace EbenezerConnectApi.Models.Dtos
{
    public class EscalaEntradaResponseDto
    {
        public int Id { get; set; }
        public int EscalaEventoId { get; set; }
        public string Dia { get; set; } = string.Empty;
        public string HorarioInicio { get; set; } = string.Empty;
        public string HorarioFim { get; set; } = string.Empty;
        public string Atividade { get; set; } = string.Empty;
        public int? CapacidadeMaxima { get; set; }
        public string NomeConselheiro { get; set; } = string.Empty;
        public bool Destaque { get; set; }
    }
}
