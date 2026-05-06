using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EbenezerConnectApi.Models.Entities
{
    public class EscalaEvento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Nome { get; set; } = string.Empty;

        public DateTime? DataInicio { get; set; }

        public DateTime? DataFim { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        public ICollection<EscalaEntrada> Entradas { get; set; } = new List<EscalaEntrada>();
    }
}
