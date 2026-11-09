using EbenezerConnectApi.Models.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Logging;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task EnviarEmailConfirmacao(Pessoa pessoa, string token)
    {
        try
        {
            var baseUrl = _configuration["AppSettings:BaseUrl"]
                          ?? throw new InvalidOperationException("BaseUrl não configurado em appsettings.json");
            var emailFrom = _configuration["EmailSettings:From"]
                            ?? throw new InvalidOperationException("EmailSettings:From não configurado em appsettings.json");
            var emailPassword = _configuration["EmailSettings:Password"]
                                ?? throw new InvalidOperationException("EmailSettings:Password não configurado em appsettings.json");

            _logger.LogInformation("📧 Iniciando envio de email de confirmação para {Email}", pessoa.Email);

            var message = MontarConfirmacao(pessoa, token, baseUrl, emailFrom);

            using var client = new SmtpClient();
            _logger.LogInformation("📡 Conectando ao SMTP...");
            await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            
            _logger.LogInformation("🔐 Autenticando no Gmail...");
            await client.AuthenticateAsync(emailFrom, emailPassword);
            
            _logger.LogInformation("✉️  Enviando email...");
            await client.SendAsync(message);
            
            _logger.LogInformation("✅ Email enviado com sucesso para {Email}", pessoa.Email);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao enviar email de confirmação para {Email}: {Message}", pessoa.Email, ex.Message);
            Console.WriteLine($"❌ Erro ao enviar email: {ex.Message}");
            throw; // Relança a exceção para o controlador capturar
        }
    }

    public static MimeMessage MontarConfirmacao(Pessoa pessoa, string token, string baseUrl, string emailFrom)
    {
        var link = $"{baseUrl}/api/auth/confirmar-email?token={token}";
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Ebenezer Camp", emailFrom));
        message.To.Add(MailboxAddress.Parse(pessoa.Email));
        message.Subject = "Confirme seu e-mail";
        message.Body = new TextPart("plain")
        {
            Text = $@"Olá {pessoa.Nome},

Clique no link abaixo para confirmar seu e-mail:
{link}

Caso não tenha se cadastrado, ignore este e-mail.

Equipe Ebenezer Camp"
        };
        return message;
    }
}
