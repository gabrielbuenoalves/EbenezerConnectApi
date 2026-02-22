using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class Quarto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
    public string Nome { get; set; } = string.Empty;
    }
}
