using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QueueController : ControllerBase
{
    private readonly IQueueService _queueService;

    public QueueController(IQueueService queueService)
    {
        _queueService = queueService;
    }

    [HttpPost("join")]
    [Authorize(Roles = "Receptionist")]
    public async Task<ActionResult<QueueEntryDTO>> JoinQueue([FromBody] JoinQueueRequest request)
    {
        if (!request.PatientId.HasValue || request.PatientId.Value <= 0)
        {
            return BadRequest(new { message = "PatientId is required. Patients cannot join the queue from the app; check in at the clinic desk." });
        }

        var symptomList = request.Symptoms?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? new List<string>();
        if (symptomList.Count == 0)
        {
            return BadRequest(new { message = "Enter at least one symptom before adding the patient to the queue." });
        }

        if (request.SensorData == null)
        {
            return BadRequest(new { message = "Fetch vitals (temperature, BP, pulse) from IoT before adding to the queue." });
        }

        if (!request.SensorData.Temperature.HasValue ||
            !request.SensorData.HeartRate.HasValue ||
            !request.SensorData.BloodPressureSystolic.HasValue ||
            !request.SensorData.BloodPressureDiastolic.HasValue)
        {
            return BadRequest(new { message = "Temperature, pulse, and blood pressure are required before queue check-in." });
        }

        request.Symptoms = symptomList;

        try
        {
            var queueEntry = await _queueService.JoinQueueAsync(request.PatientId.Value, request);
            return Ok(queueEntry);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<QueueEntryDTO>>> GetQueue()
    {
        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;
        int? doctorId = null;

        if (userRole == "Doctor")
        {
            doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        var queue = await _queueService.GetQueueAsync(doctorId);
        return Ok(queue);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QueueEntryDTO>> GetQueueEntry(int id)
    {
        var entry = await _queueService.GetQueueEntryAsync(id);
        if (entry == null)
        {
            return NotFound();
        }
        return Ok(entry);
    }
}
