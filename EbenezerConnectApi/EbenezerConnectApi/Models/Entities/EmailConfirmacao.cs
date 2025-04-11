using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class EmailConfirmacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiraEm { get; set; }

        [ForeignKey("Pessoa")]
        public int PessoaId { get; set; }

        public Pessoa Pessoa { get; set; }
    }

}
