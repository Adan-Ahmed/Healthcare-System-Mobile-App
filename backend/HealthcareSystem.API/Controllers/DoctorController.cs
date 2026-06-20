using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Doctor")]
public class DoctorController : ControllerBase
{
    private readonly IDoctorService _doctorService;
    private readonly IPatientService _patientService;

    public DoctorController(IDoctorService doctorService, IPatientService patientService)
    {
        _doctorService = doctorService;
        _patientService = patientService;
    }

    [HttpGet("queue")]
    public async Task<ActionResult<List<QueueEntryDTO>>> GetQueue()
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var queue = await _doctorService.GetQueueEntriesAsync(doctorId);
        return Ok(queue);
    }

    [HttpGet("consultations/completed")]
    public async Task<ActionResult<List<QueueEntryDTO>>> GetCompletedConsultations([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, [FromQuery] int? take)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var rows = await _doctorService.GetCompletedConsultationsAsync(doctorId, fromUtc, toUtc, take);
        return Ok(rows);
    }

    [HttpGet("consultations/completed/today")]
    public async Task<ActionResult<List<QueueEntryDTO>>> GetTodayCompletedConsultations()
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var start = DateTime.UtcNow.Date;
        var end = start.AddDays(1);
        var rows = await _doctorService.GetCompletedConsultationsAsync(doctorId, start, end, null);
        return Ok(rows);
    }

    [HttpPost("queue/{queueEntryId}/start")]
    public async Task<ActionResult> StartConsultation(int queueEntryId)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _doctorService.StartConsultationAsync(queueEntryId, doctorId);
        if (!result)
        {
            return BadRequest(new { message = "Failed to start consultation" });
        }
        return Ok(new { message = "Consultation started" });
    }

    [HttpPost("queue/{queueEntryId}/complete")]
    public async Task<ActionResult> CompleteConsultation(int queueEntryId)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _doctorService.CompleteConsultationAsync(queueEntryId, doctorId);
        if (!result)
        {
            return BadRequest(new
            {
                message = "Complete consultation only works after you have started the visit (In consultation). If you opened this screen without tapping Start, go back and tap Start first."
            });
        }
        return Ok(new { message = "Consultation completed" });
    }

    [HttpGet("patient/{patientId:int}/latest-vitals")]
    public async Task<ActionResult<SensorDataSnapshotDto?>> GetPatientLatestVitals(int patientId)
    {
        var vitals = await _patientService.GetLatestSensorDataAsync(patientId);
        if (vitals == null)
        {
            return Ok(null);
        }

        return Ok(vitals);
    }
}
