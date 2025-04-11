using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using BCrypt.Net;
using AutoMapper;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Services.Interfaces;

namespace EbenezerConnectApi.Services
{
    using BCrypt.Net;
    using EbenezerConnectApi.Models.Entities;
    using EbenezerConnectApi.Repository.Interfaces;
    using EbenezerConnectApi.Services.Interfaces;

    public class UsuarioService : IUsuarioService
    {
        private readonly IPessoaRepository _pessoaRepository;
        private readonly IEmailConfirmacaoRepository _emailConfirmacaoRepo;
        private readonly EmailService _emailService;

        public UsuarioService(
            IPessoaRepository pessoaRepository,
            IEmailConfirmacaoRepository emailConfirmacaoRepo,
            EmailService emailService)
        {
            _pessoaRepository = pessoaRepository;
            _emailConfirmacaoRepo = emailConfirmacaoRepo;
            _emailService = emailService;
        }

        public async Task Cadastrar(Pessoa pessoa, string senha)
        {
            // Hash da senha
            pessoa.SenhaHash = BCrypt.HashPassword(senha);
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

            // Enviar e-mail
            await _emailService.EnviarEmailConfirmacao(pessoa, token);
        }

        public async Task<Pessoa?> Autenticar(string email, string senha)
        {
            var usuario = await _pessoaRepository.BuscarPorEmail(email);
            if (usuario == null)
                return null;

            if (!usuario.EmailConfirmado)
                return null; // 🚫 E-mail ainda não confirmado

            bool senhaCorreta = BCrypt.Verify(senha, usuario.SenhaHash);
            return senhaCorreta ? usuario : null;
        }
    }
}