using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<List<MedicalReportDTO>>> GetPatientReports(int patientId)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // Patients can only view their own reports
        if (userRole == "Patient" && userId != patientId)
        {
            return Forbid();
        }

        var reports = await _reportService.GetPatientReportsAsync(patientId);
        return Ok(reports);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MedicalReportDTO>> GetReport(int id)
    {
        var report = await _reportService.GetReportAsync(id);
        if (report == null)
        {
            return NotFound();
        }

        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (userRole == "Patient" && report.PatientId != userId)
        {
            return Forbid();
        }

        return Ok(report);
    }

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<MedicalReportDTO>> CreateReport([FromBody] CreateReportRequest request)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var report = await _reportService.CreateReportAsync(doctorId, request);
        return Ok(report);
    }

    [HttpPost("{id}/summary")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<MedicalReportDTO>> RegenerateSummary(int id)
    {
        var updated = await _reportService.RegenerateReportSummaryAsync(id);
        if (updated == null)
        {
            return NotFound();
        }

        return Ok(updated);
    }
}
