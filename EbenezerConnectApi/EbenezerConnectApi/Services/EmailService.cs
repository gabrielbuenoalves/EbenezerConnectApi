using EbenezerConnectApi.Models.Entities;
using MailKit.Net.Smtp;
using MimeKit;

namespace EbenezerConnectApi.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public async Task EnviarSenhaTemporaria(Pessoa pessoa, string senhaTemp)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Ebenezer Camp", "no-reply@ebenezer.local"));
            message.To.Add(MailboxAddress.Parse(pessoa.Email));
            message.Subject = "Sua senha temporária";

            message.Body = new TextPart("plain")
            {
                Text = $@"Olá {pessoa.Nome},

                Você solicitou a recuperação de senha. 
                Use a senha temporária abaixo para redefinir sua senha:

                Senha temporária: {senhaTemp}

                Após usá-la, ela será invalidada.

                Equipe Ebenezer Camp"
            };

            using var client = new SmtpClient();
            await client.ConnectAsync("localhost", 25, false);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        public async Task EnviarEmailConfirmacao(Pessoa pessoa, string token)
        {
            var baseUrl = _configuration["AppSettings:BaseUrl"];
            var link = $"{baseUrl}/api/auth/confirmar-email?token={token}";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Ebenezer Camp", "no-reply@ebenezer.local"));
            message.To.Add(MailboxAddress.Parse(pessoa.Email));
            message.Subject = "Confirme seu e-mail";

            message.Body = new TextPart("plain")
            {
                Text = $@"Olá, {pessoa.Nome}!
                Clique no link para confirmar seu e-mail:
                {link}"
            };

            using var client = new SmtpClient();
            await client.ConnectAsync("localhost", 25, false); // Papercut SMTP
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
