using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EbenezerConnectApi.Models.Entities
{
    public class PrecoHistoricoProduto
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ProdutoEstoqueId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double PrecoCompra { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double PrecoVenda { get; set; }

        [Required]
        public DateTime DataInicio { get; set; }

        [ForeignKey("ProdutoEstoqueId")]
        public ProdutoEstoque Produto { get; set; }
    }

}
