using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EbenezerConnectApi.Models.Entities
{
    public class EscalaEntrada
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int EscalaEventoId { get; set; }

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

        [ForeignKey("EscalaEventoId")]
        public EscalaEvento EscalaEvento { get; set; } = null!;
    }
}
