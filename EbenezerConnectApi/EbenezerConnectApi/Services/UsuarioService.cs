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
            // Hash da senha
            pessoa.SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha);
            pessoa.EmailConfirmado = false;

            await _pessoaRepository.AdicionarPessoa(pessoa);

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
    }
}