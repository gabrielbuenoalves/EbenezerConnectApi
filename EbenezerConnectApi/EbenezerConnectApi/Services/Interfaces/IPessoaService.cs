using EbenezerConnectApi.Models.Entities;

namespace EbenezerConnectApi.Services.Interfaces
{
    public interface IPessoaService
    {
        /// <summary>
        /// Obtém todas as pessoas cadastradas.
        /// </summary>
        /// <returns>Uma lista de pessoas.</returns>
        Task<List<Pessoa>> ObterTodasPessoas();

        /// <summary>
        /// Obtém uma pessoa pelo seu ID.
        /// </summary>
        /// <param name="id">O ID da pessoa.</param>
        /// <returns>A pessoa encontrada.</returns>
        Task<Pessoa> ObterPessoaPorId(int id);

        /// <summary>
        /// Adiciona uma nova pessoa.
        /// </summary>
        /// <param name="pessoa">A pessoa a ser adicionada.</param>
        Task AdicionarPessoa(Pessoa pessoa);

        /// <summary>
        /// Atualiza os dados de uma pessoa existente.
        /// </summary>
        /// <param name="pessoa">A pessoa com os dados atualizados.</param>
        Task AtualizarPessoa(Pessoa pessoa);

        /// <summary>
        /// Remove uma pessoa pelo seu ID.
        /// </summary>
        /// <param name="id">O ID da pessoa a ser removida.</param>
        Task RemoverPessoa(int id);
    }
}
