using EbenezerConnectApi.Models.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task EnviarEmailConfirmacao(Pessoa pessoa, string token)
    {
        var baseUrl = _configuration["AppSettings:BaseUrl"]
                      ?? throw new InvalidOperationException("BaseUrl não configurado.");
        var emailFrom = _configuration["EmailSettings:From"]
                        ?? throw new InvalidOperationException("Remetente não configurado.");
        var emailPassword = _configuration["EmailSettings:Password"]
                            ?? throw new InvalidOperationException("Senha do email não configurada.");

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

        using var client = new SmtpClient();
        await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(emailFrom, emailPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
