using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<PatientDTO>> GetProfile()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var patient = await _patientService.GetPatientByIdAsync(userId);
        if (patient == null)
        {
            return NotFound();
        }
        return Ok(patient);
    }

    [HttpGet("cnic/{cnic}")]
    [Authorize(Roles = "Doctor,Receptionist")]
    public async Task<ActionResult<PatientDTO>> GetPatientByCNIC(string cnic)
    {
        var patient = await _patientService.GetPatientByCNICAsync(cnic);
        if (patient == null)
        {
            return NotFound(new { message = "Patient not found" });
        }
        return Ok(patient);
    }

    [HttpPost("symptoms")]
    public async Task<ActionResult> AddSymptom([FromBody] SymptomInputRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _patientService.AddSymptomAsync(userId, request);
        return Ok(new { message = "Symptom recorded successfully" });
    }

    [HttpPost("sensor-data")]
    public async Task<ActionResult> AddSensorData([FromBody] SensorDataRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _patientService.AddSensorDataAsync(userId, request);
        return Ok(new { message = "Sensor data recorded successfully" });
    }

    [HttpPost("clinic-register")]
    [Authorize(Roles = "Receptionist")]
    public async Task<ActionResult<PatientDTO>> CreatePatientByClinic([FromBody] ReceptionistCreatePatientRequest request)
    {
        try
        {
            var created = await _patientService.CreatePatientByReceptionistAsync(request);
            return Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
