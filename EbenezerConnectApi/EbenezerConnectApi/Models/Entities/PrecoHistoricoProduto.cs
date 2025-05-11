using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EbenezerConnectApi.Models.Entities
{
    public class PrecoHistoricoProduto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProdutoEstoqueId { get; set; }

        [ForeignKey("ProdutoEstoqueId")]
        public ProdutoEstoque? Produto { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoCompra { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoVenda { get; set; }

        [Required]
        public DateTime DataInicio { get; set; } = DateTime.Now;
    }
}
