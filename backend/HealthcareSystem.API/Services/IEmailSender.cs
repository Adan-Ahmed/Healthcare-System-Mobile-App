namespace HealthcareSystem.API.Services;

public interface IEmailSender
{
    Task SendEmailAsync(string toEmail, string subject, string plainTextBody, CancellationToken cancellationToken = default);
}
