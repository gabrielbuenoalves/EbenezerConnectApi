using EbenezerConnectApi.Models.Dtos;

namespace EbenezerConnectApi.Services.Interfaces
{
    public interface IImportacaoService
    {
        Task<ImportacaoResultadoDto> ImportarPessoasExcel(Stream fileStream);
        Task<ImportacaoResultadoDto> ImportarPessoasJson(List<ImportacaoPessoaDto> dados);
    }
}
