using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class ItemTransacaoCantina
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int TransacaoCantinaId { get; set; }

        [Required]
        public int ProdutoId { get; set; }

        [Required]
        public int Quantidade { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double PrecoVendaUnitario { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double PrecoCompraUnitario { get; set; }

        [NotMapped]
        public double LucroItem => (PrecoVendaUnitario - PrecoCompraUnitario) * Quantidade;

        [ForeignKey("TransacaoCantinaId")]
        public TransacaoCantina Transacao { get; set; }

        [ForeignKey("ProdutoId")]
        public Produto Produto { get; set; }
    }
}
