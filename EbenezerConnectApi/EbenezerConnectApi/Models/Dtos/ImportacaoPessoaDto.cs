namespace EbenezerConnectApi.Models.Dtos
{
    public class ImportacaoPessoaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Cpf { get; set; } = string.Empty;
        public string Funcao { get; set; } = "acampante"; // Por padrão, importações são de acampantes
    }

    public class ImportacaoResultadoDto
    {
        public int TotalLinhas { get; set; }
        public int Importados { get; set; }
        public int Erros { get; set; }
        public List<string> Mensagens { get; set; } = new();
    }
}
