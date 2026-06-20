using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace HealthcareSystem.API.Services;

public class AuthService : IAuthService
{
    private readonly HealthcareDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        HealthcareDbContext context,
        IConfiguration configuration,
        IEmailSender emailSender,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<PatientLoginResult> PatientLoginAsync(PatientLoginRequest request)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.CNIC == request.CNIC);

        if (patient == null || !BCrypt.Net.BCrypt.Verify(request.Password, patient.PasswordHash))
        {
            return new PatientLoginResult { Error = "invalid_credentials" };
        }

        if (!patient.EmailVerified)
        {
            return new PatientLoginResult { Error = "email_not_verified" };
        }

        return new PatientLoginResult { Auth = GenerateAuthResponse(patient.Id, patient.Name, "Patient") };
    }

    public async Task<PatientRegisterResponse> PatientRegisterAsync(PatientRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return new PatientRegisterResponse
            {
                Success = false,
                Message = "Email is required to register the patient app.",
            };
        }

        if (await _context.Patients.AnyAsync(p => p.CNIC == request.CNIC))
        {
            return new PatientRegisterResponse
            {
                Success = false,
                Message = "CNIC already registered.",
            };
        }

        var code = Random.Shared.Next(100000, 999999).ToString();
        var codeHash = BCrypt.Net.BCrypt.HashPassword(code);
        var expiryMinutes = int.Parse(_configuration["Email:OtpExpiryMinutes"] ?? "15");
        var expiry = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var patient = new Patient
        {
            CNIC = request.CNIC,
            Name = request.Name,
            Email = request.Email.Trim(),
            PhoneNumber = request.PhoneNumber,
            DateOfBirth = request.DateOfBirth,
            Address = request.Address,
            Gender = request.Gender,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            EmailVerified = false,
            EmailVerificationCodeHash = codeHash,
            EmailVerificationExpiryUtc = expiry,
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        var body =
            $"Your verification code is: {code}\n\n" +
            "This code expires in " + expiryMinutes + " minutes. If you did not request this, ignore this email.";

        try
        {
            await _emailSender.SendEmailAsync(
                patient.Email!,
                "Verify your healthcare account",
                body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", patient.Email);
        }

        return new PatientRegisterResponse
        {
            Success = true,
            RequiresEmailVerification = true,
            Message = "We sent a verification code to your email.",
            Cnic = patient.CNIC,
            EmailMasked = MaskEmail(patient.Email!),
        };
    }

    public async Task<AuthResponse?> VerifyPatientEmailAsync(PatientVerifyEmailRequest request)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.CNIC == request.CNIC);
        if (patient == null)
        {
            return null;
        }

        if (patient.EmailVerified)
        {
            return GenerateAuthResponse(patient.Id, patient.Name, "Patient");
        }

        if (patient.EmailVerificationExpiryUtc == null
            || patient.EmailVerificationExpiryUtc < DateTime.UtcNow
            || string.IsNullOrEmpty(patient.EmailVerificationCodeHash))
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Code.Trim(), patient.EmailVerificationCodeHash))
        {
            return null;
        }

        patient.EmailVerified = true;
        patient.EmailVerificationCodeHash = null;
        patient.EmailVerificationExpiryUtc = null;
        patient.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return GenerateAuthResponse(patient.Id, patient.Name, "Patient");
    }

    public async Task<PatientRegisterResponse> ResendPatientOtpAsync(PatientResendOtpRequest request)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.CNIC == request.CNIC);
        if (patient == null || patient.EmailVerified || string.IsNullOrEmpty(patient.Email))
        {
            return new PatientRegisterResponse { Success = false, Message = "Unable to resend code." };
        }

        var code = Random.Shared.Next(100000, 999999).ToString();
        patient.EmailVerificationCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
        var expiryMinutes = int.Parse(_configuration["Email:OtpExpiryMinutes"] ?? "15");
        patient.EmailVerificationExpiryUtc = DateTime.UtcNow.AddMinutes(expiryMinutes);
        await _context.SaveChangesAsync();

        var body =
            $"Your new verification code is: {code}\n\n" +
            "This code expires in " + expiryMinutes + " minutes.";

        try
        {
            await _emailSender.SendEmailAsync(patient.Email, "Verify your healthcare account", body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend verification email");
        }

        return new PatientRegisterResponse
        {
            Success = true,
            RequiresEmailVerification = true,
            Message = "A new code was sent to your email.",
            Cnic = patient.CNIC,
            EmailMasked = MaskEmail(patient.Email),
        };
    }

    public async Task<AuthResponse?> DoctorLoginAsync(DoctorLoginRequest request)
    {
        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Email == request.Email && d.IsActive);

        if (doctor == null || !BCrypt.Net.BCrypt.Verify(request.Password, doctor.PasswordHash))
        {
            return null;
        }

        return GenerateAuthResponse(doctor.Id, doctor.Name, "Doctor");
    }

    public async Task<AuthResponse?> ReceptionistLoginAsync(DoctorLoginRequest request)
    {
        var receptionist = await _context.Receptionists
            .FirstOrDefaultAsync(r => r.Email == request.Email && r.IsActive);

        if (receptionist == null || !BCrypt.Net.BCrypt.Verify(request.Password, receptionist.PasswordHash))
        {
            if (!await _context.Receptionists.AnyAsync() && request.Email == "admin@clinic.com" && request.Password == "admin123")
            {
                var newReceptionist = new Receptionist
                {
                    Name = "Clinic Admin",
                    Email = "admin@clinic.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    IsActive = true,
                };
                _context.Receptionists.Add(newReceptionist);
                await _context.SaveChangesAsync();
                return GenerateAuthResponse(newReceptionist.Id, newReceptionist.Name, "Receptionist");
            }

            return null;
        }

        return GenerateAuthResponse(receptionist.Id, receptionist.Name, "Receptionist");
    }

    public async Task<AuthResponse?> AdminLoginAsync(AdminLoginRequest request)
    {
        var admin = await _context.Admins
            .FirstOrDefaultAsync(a => a.Email == request.Email && a.IsActive);

        if (admin == null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
        {
            return null;
        }

        return GenerateAuthResponse(admin.Id, admin.Name, "Admin");
    }

    public async Task<bool> DoctorRegisterAsync(DoctorRegisterRequest request)
    {
        if (await _context.Doctors.AnyAsync(d => d.Email == request.Email))
        {
            return false;
        }

        var doctor = new Doctor
        {
            Name = request.Name,
            Specialization = request.Specialization,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            LicenseNumber = request.LicenseNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
        };

        _context.Doctors.Add(doctor);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReceptionistRegisterAsync(ReceptionistRegisterRequest request)
    {
        var email = request.Email.Trim();

        if (await _context.Receptionists.AnyAsync(r => r.Email == email))
        {
            return false;
        }

        var receptionist = new Receptionist
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
        };

        _context.Receptionists.Add(receptionist);
        await _context.SaveChangesAsync();
        return true;
    }

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1)
        {
            return "***" + email[at..];
        }

        return email[0] + "***" + email[at..];
    }

    private AuthResponse GenerateAuthResponse(int userId, string name, string userType)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "YourSuperSecretKeyForJWTTokenGeneration123456789";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "HealthcareSystem";
        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "1440");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, userType),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtIssuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserType = userType,
            UserId = userId,
            Name = name,
        };
    }
}
