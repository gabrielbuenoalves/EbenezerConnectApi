using AutoMapper;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace EbenezerConnectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;
        private readonly IPessoaRepository _pessoaRepository;
        private readonly IEmailConfirmacaoRepository _emailConfirmacaoRepository;
        private readonly IJwtService _jwtService;
        private readonly IMapper _mapper;
        private readonly EmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUsuarioService usuarioService,
            IPessoaRepository pessoaRepository,
            IEmailConfirmacaoRepository emailConfirmacaoRepository,
            IJwtService jwtService,
            IMapper mapper,
            EmailService emailService,
            ILogger<AuthController> logger)
        {
            _usuarioService = usuarioService;
            _pessoaRepository = pessoaRepository;
            _emailConfirmacaoRepository = emailConfirmacaoRepository;
            _jwtService = jwtService;
            _mapper = mapper;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (dto.Senha != dto.ConfirmarSenha)
                return BadRequest("Senha e confirmação não coincidem.");

            try
            {
                var pessoa = _mapper.Map<Pessoa>(dto);
                await _usuarioService.Cadastrar(pessoa, dto.Senha);

                return Ok("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.");
            }
            catch (Exception ex)
            {
                // Loga o erro para aparecer no log streaming da Azure
                Console.WriteLine($"Erro ao registrar usuário: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, "Erro interno ao tentar registrar o usuário.");
            }
        }



        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            try
            {
                var usuario = await _pessoaRepository.BuscarPorEmail(dto.Email);
                if (usuario == null)
                    return Unauthorized("Credenciais inválidas.");

                if (!usuario.EmailConfirmado)
                    return Unauthorized("E-mail ainda não confirmado. Verifique sua caixa de entrada.");

                if (!BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
                    return Unauthorized("Credenciais inválidas.");

                var token = _jwtService.GerarToken(usuario);
                var response = _mapper.Map<LoginResponseDto>(usuario);
                response.Token = token;

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao realizar login");
                return StatusCode(500, "Erro interno ao tentar fazer login.");
            }
        }

        [AllowAnonymous]
        [HttpPost("redefinir-senha")]
        public async Task<IActionResult> RedefinirSenha([FromBody] RedefinirSenhaDto dto)
        {
            try
            {
                var pessoa = await _pessoaRepository.BuscarPorEmail(dto.Email);
                if (pessoa == null)
                    return BadRequest("Usuário não encontrado.");

                if (string.IsNullOrEmpty(pessoa.SenhaTemporariaHash) ||
                    !BCrypt.Net.BCrypt.Verify(dto.SenhaTemporaria, pessoa.SenhaTemporariaHash))
                    return BadRequest("Senha temporária inválida.");

                pessoa.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
                pessoa.SenhaTemporariaHash = null;

                await _pessoaRepository.AtualizarPessoa(pessoa);

                return Ok("Senha redefinida com sucesso.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao redefinir senha");
                return StatusCode(500, "Erro interno ao tentar redefinir a senha.");
            }
        }

        [AllowAnonymous]
        [HttpGet("confirmar-email")]
        public async Task<IActionResult> ConfirmarEmail([FromQuery] string token)
        {
            try
            {
                var confirmacao = await _emailConfirmacaoRepository.BuscarPorToken(token);
                if (confirmacao == null || confirmacao.ExpiraEm < DateTime.UtcNow)
                    return BadRequest("Token inválido ou expirado.");

                var pessoa = confirmacao.Pessoa;
                pessoa.EmailConfirmado = true;
                await _pessoaRepository.AtualizarPessoa(pessoa);
                await _emailConfirmacaoRepository.Remover(confirmacao);

                return Ok("E-mail confirmado com sucesso! Agora você pode fazer login.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao confirmar e-mail");
                return StatusCode(500, "Erro interno ao tentar confirmar o e-mail.");
            }
        }
    }
}
