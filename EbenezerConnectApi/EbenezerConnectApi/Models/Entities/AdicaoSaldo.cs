using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EbenezerConnectApi.Models.Entities
{
    public class AdicaoSaldo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PessoaId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Valor { get; set; }

        [Required]
        public DateTime DataAdicao { get; set; }

        public bool Revertida { get; set; } = false;

        public DateTime? DataReversao { get; set; }

        [ForeignKey("PessoaId")]
        public Pessoa Pessoa { get; set; } = null!;
    }
}
