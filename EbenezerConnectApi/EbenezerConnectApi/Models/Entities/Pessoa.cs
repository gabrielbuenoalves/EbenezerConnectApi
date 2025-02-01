using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Entities
{
    public class Pessoa
    {
        [Key] // Define a propriedade como chave primária
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // Auto-incremento
        public int Id { get; set; }

        [Required] // Not null
        [StringLength(50)] // Define o tamanho máximo da string
        public string Funcao { get; set; } // "acampante" ou "conselheiro"

        [Required] // Not null
        [StringLength(100)] // Define o tamanho máximo da string
        public string Nome { get; set; }

        [Required] // Not null
        [StringLength(11)] // CPF com 11 caracteres
        [Column(TypeName = "varchar(11)")] // Define o tipo da coluna no banco de dados
        public string Cpf { get; set; }

        [StringLength(50)] // Define o tamanho máximo da string
        public string? Quarto { get; set; } // Pode ser nulo

        [StringLength(100)] // Define o tamanho máximo da string
        public string? Igreja { get; set; } // Pode ser nulo

        [Required] // Not null
        [Column(TypeName = "decimal(18, 2)")] // Define o tipo da coluna no banco de dados
        public double Saldo { get; set; } = 0; // Valor padrão é 0
    }
}
