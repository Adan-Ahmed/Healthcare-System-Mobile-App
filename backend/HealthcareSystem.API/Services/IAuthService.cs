using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IAuthService
{
    Task<PatientLoginResult> PatientLoginAsync(PatientLoginRequest request);
    Task<PatientRegisterResponse> PatientRegisterAsync(PatientRegisterRequest request);
    Task<AuthResponse?> VerifyPatientEmailAsync(PatientVerifyEmailRequest request);
    Task<PatientRegisterResponse> ResendPatientOtpAsync(PatientResendOtpRequest request);
    Task<AuthResponse?> DoctorLoginAsync(DoctorLoginRequest request);
    Task<AuthResponse?> ReceptionistLoginAsync(DoctorLoginRequest request);
    Task<AuthResponse?> AdminLoginAsync(AdminLoginRequest request);
    Task<bool> DoctorRegisterAsync(DoctorRegisterRequest request);
    Task<bool> ReceptionistRegisterAsync(ReceptionistRegisterRequest request);
}
