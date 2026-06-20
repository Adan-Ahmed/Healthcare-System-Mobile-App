using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrescriptionController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<PrescriptionDTO>> CreatePrescription([FromBody] CreatePrescriptionRequest request)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var prescription = await _prescriptionService.CreatePrescriptionAsync(doctorId, request);
        return Ok(prescription);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<List<PrescriptionDTO>>> GetPatientPrescriptions(int patientId)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        if (userRole == "Patient" && userId != patientId)
        {
            return Forbid();
        }

        if (userRole != "Patient" && userRole != "Doctor")
        {
            return Forbid();
        }

        var prescriptions = await _prescriptionService.GetPatientPrescriptionsAsync(patientId);
        return Ok(prescriptions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PrescriptionDTO>> GetPrescription(int id)
    {
        var prescription = await _prescriptionService.GetPrescriptionAsync(id);
        if (prescription == null)
        {
            return NotFound();
        }
        return Ok(prescription);
    }
}
