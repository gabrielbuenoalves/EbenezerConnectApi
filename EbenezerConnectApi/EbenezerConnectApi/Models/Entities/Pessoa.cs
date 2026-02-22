using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class Pessoa
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
    public string Funcao { get; set; } = string.Empty; // "acampante", "conselheiro", "admin"

    [Required]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [StringLength(11)]
    [Column(TypeName = "varchar(11)")]
    public string Cpf { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty; // Adicionado para autenticação

    [Required]
    public string SenhaHash { get; set; } = string.Empty; // Hash da senha, não armazenar senha pura!
        public double Saldo { get; set; } = 0;

        // Ligação com quarto (opcional)
        public int? QuartoId { get; set; }
        public Quarto? Quarto { get; set; }
        public string? SenhaTemporariaHash { get; set; }
        public bool EmailConfirmado { get; set; } = false;

    }
}
