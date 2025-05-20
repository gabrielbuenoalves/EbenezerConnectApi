using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class TransacaoCantina
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PessoaId { get; set; }

        [Required]
        public DateTime DataTransacao { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double Valor { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } // saldo / avista / pendente

        [ForeignKey("PessoaId")]
        public Pessoa Pessoa { get; set; }

        public ICollection<ItemTransacaoCantina> Itens { get; set; }
    }
}
