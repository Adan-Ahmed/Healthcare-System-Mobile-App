using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace HealthcareSystem.API.Services;

/// <summary>
/// SMTP via MailKit (correct TLS for port 465 SslOnConnect and 587 STARTTLS).
/// System.Net.Mail.SmtpClient often fails on modern hosts with ConnectCallback / TLS errors.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string plainTextBody, CancellationToken cancellationToken = default)
    {
        var host = _configuration["Email:SmtpHost"];
        var port = int.TryParse(_configuration["Email:SmtpPort"], out var p) ? p : 587;
        var user = _configuration["Email:SmtpUser"];
        var pass = _configuration["Email:SmtpPassword"];
        var from = _configuration["Email:FromAddress"] ?? user;
        var fromName = _configuration["Email:FromName"] ?? "Healthcare System";

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            _logger.LogWarning(
                "Email not configured (Email:SmtpHost / FromAddress). OTP for {To}: {Body}",
                toEmail,
                plainTextBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, from));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") {Text = plainTextBody};

        var socketOptions = ResolveSecureSocket(port, _configuration["Email:SecureSocket"], _configuration.GetValue("Email:UseSsl", true));

        using var client = new SmtpClient();
        client.Timeout = (int)TimeSpan.FromSeconds(30).TotalMilliseconds;

        try
        {
            await client.ConnectAsync(host, port, socketOptions, cancellationToken);

            if (!string.IsNullOrEmpty(user))
            {
                await client.AuthenticateAsync(user, pass ?? string.Empty, cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "SMTP failed (host={Host}, port={Port}, secure={Secure}). Check Email:SecureSocket (SslOnConnect for 465, StartTls for 587).",
                host,
                port,
                socketOptions);
            throw;
        }
    }

    private static SecureSocketOptions ResolveSecureSocket(int port, string? explicitMode, bool legacyUseSsl)
    {
        if (!string.IsNullOrWhiteSpace(explicitMode))
        {
            return explicitMode.Trim().ToLowerInvariant() switch
            {
                "sslonconnect" or "ssl" => SecureSocketOptions.SslOnConnect,
                "starttls" => SecureSocketOptions.StartTls,
                "starttlswhenavailable" => SecureSocketOptions.StartTlsWhenAvailable,
                "none" => SecureSocketOptions.None,
                "auto" => SecureSocketOptions.Auto,
                _ => SecureSocketOptions.Auto,
            };
        }

        return port switch
        {
            465 => SecureSocketOptions.SslOnConnect,
            587 => SecureSocketOptions.StartTls,
            25 => legacyUseSsl ? SecureSocketOptions.StartTlsWhenAvailable : SecureSocketOptions.None,
            _ => legacyUseSsl ? SecureSocketOptions.StartTlsWhenAvailable : SecureSocketOptions.Auto,
        };
    }
}
