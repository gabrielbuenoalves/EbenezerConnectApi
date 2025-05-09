using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class ProdutoEstoque
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; }

        [Required]
        public int QuantidadeEmEstoque { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double PrecoCompraAtual { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public double PrecoVendaAtual { get; set; }

        public ICollection<PrecoHistoricoProduto> HistoricoPrecos { get; set; }
        public ICollection<ItemTransacaoCantina> ItensTransacao { get; set; }
    }

}
