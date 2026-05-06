using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Dtos
{
    public class CriarEscalaEntradaDto
    {
        [Required]
        [StringLength(20)]
        public string Dia { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string HorarioInicio { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string HorarioFim { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string Atividade { get; set; } = string.Empty;

        public int? CapacidadeMaxima { get; set; }

        [Required]
        [StringLength(100)]
        public string NomeConselheiro { get; set; } = string.Empty;

        public bool Destaque { get; set; } = false;
    }
}
