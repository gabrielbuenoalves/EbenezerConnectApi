using AutoMapper;
using EbenezerConnectApi.Models.Dtos;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services;
using EbenezerConnectApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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


        public AuthController(
            IUsuarioService usuarioService,
            IPessoaRepository pessoaRepository,
            IEmailConfirmacaoRepository emailConfirmacaoRepository,
            IJwtService jwtService,
            IMapper mapper,
            EmailService emailService)
        {
            _usuarioService = usuarioService;
            _pessoaRepository = pessoaRepository;
            _emailConfirmacaoRepository = emailConfirmacaoRepository;
            _jwtService = jwtService;
            _mapper = mapper;
            _emailService = emailService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (dto.Senha != dto.ConfirmarSenha)
                return BadRequest("Senha e confirmação não coincidem.");

            var pessoa = _mapper.Map<Pessoa>(dto);
            await _usuarioService.Cadastrar(pessoa, dto.Senha);

            return Ok("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.");
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            var usuario = await _pessoaRepository.BuscarPorEmail(dto.Email);
            if (usuario == null)
                return Unauthorized("Credenciais inválidas.");

            if (!usuario.EmailConfirmado    )
                return Unauthorized("E-mail ainda não confirmado. Verifique sua caixa de entrada.");

            if (!BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
                return Unauthorized("Credenciais inválidas.");

            var token = _jwtService.GerarToken(usuario);
            var response = _mapper.Map<LoginResponseDto>(usuario);
            response.Token = token;

            return Ok(response);
        }
        //[AllowAnonymous]
        //[HttpPost("esqueci-senha")]
        //public async Task<IActionResult> EsqueciSenha([FromBody] EmailDto dto)
        //{
        //    var pessoa = await _pessoaRepository.BuscarPorEmail(dto.Email);
        //    if (pessoa == null)
        //        return BadRequest("Usuário não encontrado.");

        //    var senhaTemp = Guid.NewGuid().ToString().Substring(0, 8);
        //    pessoa.SenhaTemporariaHash = BCrypt.Net.BCrypt.HashPassword(senhaTemp);
        //    await _pessoaRepository.AtualizarPessoa(pessoa);

        //    await _emailService.EnviarSenhaTemporaria(pessoa, senhaTemp);

        //    return Ok("Senha temporária enviada ao e-mail.");
        //}
        [AllowAnonymous]
        [HttpPost("redefinir-senha")]
        public async Task<IActionResult> RedefinirSenha([FromBody] RedefinirSenhaDto dto)
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

        [AllowAnonymous]
        [HttpGet("confirmar-email")]
        public async Task<IActionResult> ConfirmarEmail([FromQuery] string token)
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
    }
}
