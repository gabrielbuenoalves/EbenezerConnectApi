using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class Quarto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nome { get; set; }

        [Required]
        public int Capacidade { get; set; }

        public ICollection<Pessoa> Pessoas { get; set; } = new List<Pessoa>();
    }
}
