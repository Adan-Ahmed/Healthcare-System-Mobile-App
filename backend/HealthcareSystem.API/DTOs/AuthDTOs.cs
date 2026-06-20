namespace HealthcareSystem.API.DTOs;

public class PatientLoginRequest
{
    public string CNIC { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class PatientRegisterRequest
{
    public string CNIC { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? Gender { get; set; }
    public string Password { get; set; } = string.Empty;
}

public class DoctorLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class DoctorRegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Create a clinic receptionist account (desk login). Same trust model as <see cref="DoctorRegisterRequest"/> (admin-only in practice).
/// </summary>
public class ReceptionistRegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty; // "Patient" or "Doctor"
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class PatientRegisterResponse
{
    public bool Success { get; set; }
    public bool RequiresEmailVerification { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Cnic { get; set; }
    public string? EmailMasked { get; set; }
    public string? Token { get; set; }
    public string? UserType { get; set; }
    public int? UserId { get; set; }
    public string? Name { get; set; }
}

public class PatientVerifyEmailRequest
{
    public string CNIC { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class PatientResendOtpRequest
{
    public string CNIC { get; set; } = string.Empty;
}
