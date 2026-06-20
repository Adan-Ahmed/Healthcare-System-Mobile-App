namespace HealthcareSystem.API.DTOs;

public class PatientLoginResult
{
    public AuthResponse? Auth { get; set; }
    public string? Error { get; set; }
}
