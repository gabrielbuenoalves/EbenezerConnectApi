using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class ProdutoEstoque
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Nome { get; set; }

        [Required]
        public int QuantidadeEmEstoque { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoCompraAtual { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoVendaAtual { get; set; }

        // 👇 Remova qualquer Required aqui
        public ICollection<PrecoHistoricoProduto>? HistoricoPrecos { get; set; }
    }


}
