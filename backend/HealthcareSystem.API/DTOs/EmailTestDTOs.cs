using System.ComponentModel.DataAnnotations;

namespace HealthcareSystem.API.DTOs;

public class SendTestEmailRequest
{
    [Required]
    [EmailAddress]
    public string ToEmail { get; set; } = string.Empty;
}
