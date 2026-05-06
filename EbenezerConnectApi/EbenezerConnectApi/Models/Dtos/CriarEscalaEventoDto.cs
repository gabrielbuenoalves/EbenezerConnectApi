using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Dtos
{
    public class CriarEscalaEventoDto
    {
        [Required]
        [StringLength(200)]
        public string Nome { get; set; } = string.Empty;

        public DateTime? DataInicio { get; set; }

        public DateTime? DataFim { get; set; }
    }
}
