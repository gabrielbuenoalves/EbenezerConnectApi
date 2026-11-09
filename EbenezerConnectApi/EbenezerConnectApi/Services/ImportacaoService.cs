using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using OfficeOpenXml;
using System.Text.RegularExpressions;

namespace EbenezerConnectApi.Services
{
    public class ImportacaoService : IImportacaoService
    {
        private readonly IPessoaRepository _pessoaRepository;
        private readonly IUsuarioService _usuarioService;

        public ImportacaoService(IPessoaRepository pessoaRepository, IUsuarioService usuarioService)
        {
            _pessoaRepository = pessoaRepository;
            _usuarioService = usuarioService;
        }

    public async Task<ImportacaoResultadoDto> ImportarPessoasExcel(Stream fileStream)
        {
            var resultado = new ImportacaoResultadoDto();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            try
            {
                Console.WriteLine($"[ImportacaoService] Iniciando importação. Tamanho do arquivo: {fileStream.Length} bytes");

                using var package = new ExcelPackage(fileStream);
                var worksheet = package.Workbook.Worksheets[0];
                var rowCount = worksheet.Dimension?.Rows ?? 0;

                Console.WriteLine($"[ImportacaoService] Arquivo lido. Planilha tem {rowCount} linhas");

                if (rowCount <= 1)
                {
                    resultado.Mensagens.Add("Planilha vazia ou sem dados.");
                    return resultado;
                }

                resultado.TotalLinhas = rowCount - 1; // Subtrai o cabeçalho

                for (int row = 2; row <= rowCount; row++)
                {
                    try
                    {
                        var nome = worksheet.Cells[row, 1].Value?.ToString()?.Trim() ?? "";
                        var email = worksheet.Cells[row, 2].Value?.ToString()?.Trim() ?? "";
                        var cpf = worksheet.Cells[row, 3].Value?.ToString()?.Trim() ?? "";
                        var funcao = worksheet.Cells[row, 4].Value?.ToString()?.Trim()?.ToLower() ?? "acampante";

                        Console.WriteLine($"[ImportacaoService] Linha {row}: {nome}, {email}, {cpf}, {funcao}");

                        // Validações básicas
                        if (string.IsNullOrWhiteSpace(nome))
                        {
                            resultado.Erros++;
                            resultado.Mensagens.Add($"Linha {row}: Nome é obrigatório.");
                            continue;
                        }

                        if (!string.IsNullOrWhiteSpace(email) && !IsValidEmail(email))
                        {
                            resultado.Erros++;
                            resultado.Mensagens.Add($"Linha {row}: E-mail inválido.");
                            continue;
                        }

                        if (!string.IsNullOrWhiteSpace(cpf) && !IsValidCpf(cpf))
                        {
                            resultado.Erros++;
                            resultado.Mensagens.Add($"Linha {row}: CPF inválido.");
                            continue;
                        }

                        // Remove formatação do CPF quando informado
                        cpf = string.IsNullOrWhiteSpace(cpf)
                            ? ""
                            : cpf.Replace(".", "").Replace("-", "").Replace(" ", "");

                        // Valida função
                        if (!new[] { "acampante", "conselheiro", "admin" }.Contains(funcao.ToLower()))
                        {
                            funcao = "acampante";
                        }

                        // Verifica se já existe
                        if (!string.IsNullOrWhiteSpace(email))
                        {
                            Console.WriteLine($"[ImportacaoService] Buscando por email: {email}");
                            var pessoaExistente = await _pessoaRepository.BuscarPorEmail(email);
                            if (pessoaExistente != null)
                            {
                                resultado.Erros++;
                                resultado.Mensagens.Add($"Linha {row}: E-mail {email} já cadastrado.");
                                continue;
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(cpf))
                        {
                            Console.WriteLine($"[ImportacaoService] Buscando por CPF: {cpf}");
                            var pessoaPorCpf = await _pessoaRepository.BuscarPorCpf(cpf);
                            if (pessoaPorCpf != null)
                            {
                                resultado.Erros++;
                                resultado.Mensagens.Add($"Linha {row}: CPF {cpf} já cadastrado.");
                                continue;
                            }
                        }
                        else
                        {
                            cpf = await GerarCpfTecnicoUnico();
                        }

                        var senhaTemporaria = GerarSenhaTemporaria(cpf);

                        var pessoa = new Pessoa
                        {
                            Nome = nome,
                            Email = email,
                            Cpf = cpf,
                            Funcao = funcao,
                            EmailConfirmado = false
                        };

                        Console.WriteLine($"[ImportacaoService] Cadastrando usuário: {nome}");
                        await _usuarioService.Cadastrar(pessoa, senhaTemporaria);

                        resultado.Importados++;
                        resultado.Mensagens.Add($"Linha {row}: {nome} importado com sucesso. Senha temporária: {senhaTemporaria}");
                        Console.WriteLine($"[ImportacaoService] Usuário {nome} cadastrado com sucesso");
                    }
                    catch (Exception ex)
                    {
                        resultado.Erros++;
                        resultado.Mensagens.Add($"Linha {row}: Erro ao processar - {ex.Message}");
                        Console.WriteLine($"[ImportacaoService] Erro na linha {row}: {ex}");
                    }
                }
            }
            catch (Exception ex)
            {
                resultado.Mensagens.Add($"Erro ao processar arquivo: {ex.Message}");
                Console.WriteLine($"[ImportacaoService] Erro geral: {ex}");
            }

            Console.WriteLine($"[ImportacaoService] Importação finalizada. Importados: {resultado.Importados}, Erros: {resultado.Erros}");
            return resultado;
        }

        public async Task<ImportacaoResultadoDto> ImportarPessoasJson(List<ImportacaoPessoaDto> dados)
        {
            var resultado = new ImportacaoResultadoDto();

            if (dados == null || dados.Count == 0)
            {
                resultado.Mensagens.Add("Lista de pessoas vazia.");
                return resultado;
            }

            resultado.TotalLinhas = dados.Count;

            for (int i = 0; i < dados.Count; i++)
            {
                try
                {
                    var linha = i + 1; // Para exibir a linha como se fosse do índice 1
                    var pessoa = dados[i];
                    
                    var nome = pessoa.Nome?.Trim() ?? "";
                    var email = pessoa.Email?.Trim() ?? "";
                    var cpf = pessoa.Cpf?.Trim() ?? "";
                    var funcao = pessoa.Funcao?.Trim()?.ToLower() ?? "acampante";

                    Console.WriteLine($"[ImportacaoService] Linha {linha}: {nome}, {email}, {cpf}, {funcao}");

                    // Validações básicas
                    if (string.IsNullOrWhiteSpace(nome))
                    {
                        resultado.Erros++;
                        resultado.Mensagens.Add($"Linha {linha}: Nome é obrigatório.");
                        continue;
                    }

                    if (!string.IsNullOrWhiteSpace(email) && !IsValidEmail(email))
                    {
                        resultado.Erros++;
                        resultado.Mensagens.Add($"Linha {linha}: E-mail inválido.");
                        continue;
                    }

                    if (!string.IsNullOrWhiteSpace(cpf) && !IsValidCpf(cpf))
                    {
                        resultado.Erros++;
                        resultado.Mensagens.Add($"Linha {linha}: CPF inválido.");
                        continue;
                    }

                    // Remove formatação do CPF quando informado
                    cpf = string.IsNullOrWhiteSpace(cpf)
                        ? ""
                        : cpf.Replace(".", "").Replace("-", "").Replace(" ", "");

                    // Valida função
                    if (!new[] { "acampante", "conselheiro", "admin" }.Contains(funcao.ToLower()))
                    {
                        funcao = "acampante";
                    }

                    // Verifica se já existe
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        Console.WriteLine($"[ImportacaoService] Buscando por email: {email}");
                        var pessoaExistente = await _pessoaRepository.BuscarPorEmail(email);
                        if (pessoaExistente != null)
                        {
                            resultado.Erros++;
                            resultado.Mensagens.Add($"Linha {linha}: E-mail {email} já cadastrado.");
                            continue;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(cpf))
                    {
                        Console.WriteLine($"[ImportacaoService] Buscando por CPF: {cpf}");
                        var pessoaPorCpf = await _pessoaRepository.BuscarPorCpf(cpf);
                        if (pessoaPorCpf != null)
                        {
                            resultado.Erros++;
                            resultado.Mensagens.Add($"Linha {linha}: CPF {cpf} já cadastrado.");
                            continue;
                        }
                    }
                    else
                    {
                        cpf = await GerarCpfTecnicoUnico();
                    }

                    var senhaTemporaria = GerarSenhaTemporaria(cpf);

                    var novaPessoa = new Pessoa
                    {
                        Nome = nome,
                        Email = email,
                        Cpf = cpf,
                        Funcao = funcao,
                        EmailConfirmado = false
                    };

                    Console.WriteLine($"[ImportacaoService] Cadastrando usuário: {nome}");
                    await _usuarioService.Cadastrar(novaPessoa, senhaTemporaria);

                    resultado.Importados++;
                    resultado.Mensagens.Add($"Linha {linha}: {nome} importado com sucesso. Senha temporária: {senhaTemporaria}");
                    Console.WriteLine($"[ImportacaoService] Usuário {nome} cadastrado com sucesso");
                }
                catch (Exception ex)
                {
                    resultado.Erros++;
                    resultado.Mensagens.Add($"Linha {i + 1}: Erro ao processar - {ex.Message}");
                    Console.WriteLine($"[ImportacaoService] Erro na linha {i + 1}: {ex}");
                }
            }

            Console.WriteLine($"[ImportacaoService] Importação finalizada. Importados: {resultado.Importados}, Erros: {resultado.Erros}");
            return resultado;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
                return regex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }

        private bool IsValidCpf(string cpf)
        {
            cpf = cpf.Replace(".", "").Replace("-", "").Replace(" ", "");
            return cpf.Length == 11 && cpf.All(char.IsDigit);
        }

        private static string GerarSenhaTemporaria(string cpf)
        {
            var prefixoCpf = !string.IsNullOrWhiteSpace(cpf) && cpf.Length >= 6
                ? cpf.Substring(0, 6)
                : string.Empty;

            string senha;
            do
            {
                senha = Random.Shared.Next(100000, 999999).ToString();
            }
            while (senha == prefixoCpf);

            return senha;
        }

        private async Task<string> GerarCpfTecnicoUnico()
        {
            while (true)
            {
                var cpfTecnico = Random.Shared.Next(100000000, 999999999).ToString() + Random.Shared.Next(10, 99).ToString();
                var existente = await _pessoaRepository.BuscarPorCpf(cpfTecnico);
                if (existente == null)
                {
                    return cpfTecnico;
                }
            }
        }
    }
}
