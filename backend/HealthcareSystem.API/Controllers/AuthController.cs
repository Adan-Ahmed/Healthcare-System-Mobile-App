using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("patient/register")]
    [AllowAnonymous]
    public async Task<ActionResult<PatientRegisterResponse>> PatientRegister([FromBody] PatientRegisterRequest request)
    {
        var response = await _authService.PatientRegisterAsync(request);
        if (!response.Success)
        {
            return BadRequest(new { message = response.Message });
        }

        return Ok(response);
    }

    [HttpPost("patient/verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> VerifyPatientEmail([FromBody] PatientVerifyEmailRequest request)
    {
        var response = await _authService.VerifyPatientEmailAsync(request);
        if (response == null)
        {
            return BadRequest(new { message = "Invalid or expired code" });
        }

        return Ok(response);
    }

    [HttpPost("patient/resend-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<PatientRegisterResponse>> ResendPatientOtp([FromBody] PatientResendOtpRequest request)
    {
        var response = await _authService.ResendPatientOtpAsync(request);
        if (!response.Success)
        {
            return BadRequest(new { message = response.Message });
        }

        return Ok(response);
    }

    [HttpPost("patient/login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> PatientLogin([FromBody] PatientLoginRequest request)
    {
        var result = await _authService.PatientLoginAsync(request);
        if (result.Error == "email_not_verified")
        {
            return Unauthorized(new { message = "Please verify your email before signing in.", code = "email_not_verified" });
        }

        if (result.Auth == null)
        {
            return Unauthorized(new { message = "Invalid CNIC or password" });
        }

        return Ok(result.Auth);
    }

    [HttpPost("doctor/login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> DoctorLogin([FromBody] DoctorLoginRequest request)
    {
        var response = await _authService.DoctorLoginAsync(request);
        if (response == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }
        return Ok(response);
    }

    [HttpPost("receptionist/login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> ReceptionistLogin([FromBody] DoctorLoginRequest request)
    {
        var response = await _authService.ReceptionistLoginAsync(request);
        if (response == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }
        return Ok(response);
    }

    [HttpPost("admin/login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> AdminLogin([FromBody] AdminLoginRequest request)
    {
        var response = await _authService.AdminLoginAsync(request);
        if (response == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        return Ok(response);
    }
}
