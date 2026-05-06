using System.ComponentModel.DataAnnotations;

namespace EbenezerConnectApi.Models.Dtos
{
    public class CriarEscalaEventoDto
    {
        [Required]
        [StringLength(200)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime? DataInicio { get; set; }

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime? DataFim { get; set; }
    }
}
