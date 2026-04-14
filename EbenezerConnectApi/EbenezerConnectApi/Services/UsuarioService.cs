using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using BCrypt.Net;
using AutoMapper;
using EbenezerConnectApi.Repository;
using Microsoft.Extensions.Logging;

namespace EbenezerConnectApi.Services
{
    public class UsuarioService : IUsuarioService
    {
        private const string EmailTecnicoDomain = "sem-email.local";

        private readonly IPessoaRepository _pessoaRepository;
        private readonly IEmailConfirmacaoRepository _emailConfirmacaoRepo;
        private readonly EmailService _emailService;
        private readonly ILogger<UsuarioService> _logger;

        public UsuarioService(
            IPessoaRepository pessoaRepository,
            IEmailConfirmacaoRepository emailConfirmacaoRepo,
            EmailService emailService,
            ILogger<UsuarioService> logger)
        {
            _pessoaRepository = pessoaRepository;
            _emailConfirmacaoRepo = emailConfirmacaoRepo;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task Cadastrar(Pessoa pessoa, string senha)
        {
            pessoa.Email = pessoa.Email?.Trim() ?? string.Empty;
            pessoa.Cpf = pessoa.Cpf?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(pessoa.Cpf))
            {
                pessoa.Cpf = await GerarCpfTecnicoUnico();
            }

            if (string.IsNullOrWhiteSpace(pessoa.Email))
            {
                pessoa.Email = GerarEmailTecnico(pessoa.Cpf);
            }

            var possuiEmailReal = !EhEmailTecnico(pessoa.Email);

            // Hash da senha
            pessoa.SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha);
            pessoa.EmailConfirmado = !possuiEmailReal;

            await _pessoaRepository.AdicionarPessoa(pessoa);

            if (!possuiEmailReal)
            {
                return;
            }

            // Criar token de verificação
            var token = Guid.NewGuid().ToString();
            var confirmacao = new EmailConfirmacao
            {
                Token = token,
                PessoaId = pessoa.Id,
                ExpiraEm = DateTime.UtcNow.AddHours(24)
            };

            await _emailConfirmacaoRepo.SalvarToken(confirmacao);

            // Enviar e-mail sem falhar o cadastro caso o SMTP esteja indisponível
            try
            {
                await _emailService.EnviarEmailConfirmacao(pessoa, token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Cadastro realizado, mas o e-mail de confirmação falhou para {Email}", pessoa.Email);
            }
        }

        public async Task<Pessoa?> Autenticar(string email, string senha)
        {
            var usuario = await _pessoaRepository.BuscarPorEmail(email);
            if (usuario == null)
                return null;

            if (!usuario.EmailConfirmado)
                return null; // 🚫 E-mail ainda não confirmado

            bool senhaCorreta = BCrypt.Net.BCrypt.Verify(senha, usuario.SenhaHash);
            return senhaCorreta ? usuario : null;
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

        private static string GerarEmailTecnico(string cpf)
        {
            return $"sem-email-{cpf}@{EmailTecnicoDomain}";
        }

        private static bool EhEmailTecnico(string email)
        {
            return email.EndsWith($"@{EmailTecnicoDomain}", StringComparison.OrdinalIgnoreCase)
                && email.StartsWith("sem-email-", StringComparison.OrdinalIgnoreCase);
        }
    }
}