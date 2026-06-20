using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]

public class EmailController : ControllerBase
{
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailController> _logger;

    public EmailController(
        IEmailSender emailSender,
        IConfiguration configuration,
        ILogger<EmailController> logger)
    {
        _emailSender = emailSender;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Sends a plain-text test message to verify SMTP settings (clinic or doctor JWT required).
    /// </summary>
    [HttpPost("test")]
    public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (string.IsNullOrWhiteSpace(_configuration["Email:SmtpHost"])
            || string.IsNullOrWhiteSpace(_configuration["Email:FromAddress"] ?? _configuration["Email:SmtpUser"]))
        {
            return BadRequest(new { message = "SMTP is not configured. Set Email:SmtpHost and Email:FromAddress in configuration." });
        }

        var to = request.ToEmail.Trim();
        var subject = "Healthcare System — email test";
        var body =
            "This is a test email from your Healthcare System API.\n\n" +
            "If you received this, SMTP configuration is working correctly.\n\n" +
            $"Sent at (UTC): {DateTime.UtcNow:O}";

        try
        {
            await _emailSender.SendEmailAsync(to, subject, body, cancellationToken);
            _logger.LogInformation("Test email sent successfully to {To}", to);
            return Ok(new { message = "Test email sent.", toEmail = to });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test email failed to {To}", to);
            return StatusCode(502, new
            {
                message = "Failed to send email. Check SMTP settings and server logs.",
                detail = ex.Message,
            });
        }
    }
}
