using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace HealthcareSystem.API.Services;

public class ReportService : IReportService
{
    private readonly HealthcareDbContext _context;
    private readonly IAIService _aiService;

    public ReportService(HealthcareDbContext context, IAIService aiService)
    {
        _context = context;
        _aiService = aiService;
    }

    public async Task<List<MedicalReportDTO>> GetPatientReportsAsync(int patientId)
    {
        var reports = await _context.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.ReportDate)
            .ToListAsync();

        return reports.Select(r => new MedicalReportDTO
        {
            Id = r.Id,
            PatientId = r.PatientId,
            PatientName = r.Patient.Name,
            DoctorId = r.DoctorId,
            DoctorName = r.Doctor?.Name,
            ReportType = r.ReportType,
            ReportData = r.ReportData,
            Summary = r.Summary,
            ReportDate = r.ReportDate,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<MedicalReportDTO> CreateReportAsync(int doctorId, CreateReportRequest request)
    {
        var report = new MedicalReport
        {
            PatientId = request.PatientId,
            DoctorId = doctorId,
            ReportType = request.ReportType,
            ReportData = request.ReportData,
            ReportDate = DateTime.UtcNow
        };

        // Generate AI summary
        var summaryContext = await BuildReportSummaryContextAsync(report.PatientId, doctorId, request.ReportType, request.ReportData);
        report.Summary = await _aiService.GenerateReportSummaryAsync(summaryContext);

        _context.MedicalReports.Add(report);
        await _context.SaveChangesAsync();

        var patient = await _context.Patients.FindAsync(request.PatientId);
        var doctor = await _context.Doctors.FindAsync(doctorId);

        return new MedicalReportDTO
        {
            Id = report.Id,
            PatientId = report.PatientId,
            PatientName = patient?.Name ?? "",
            DoctorId = report.DoctorId,
            DoctorName = doctor?.Name,
            ReportType = report.ReportType,
            ReportData = report.ReportData,
            Summary = report.Summary,
            ReportDate = report.ReportDate,
            CreatedAt = report.CreatedAt
        };
    }

    public async Task<MedicalReportDTO?> GetReportAsync(int reportId)
    {
        var report = await _context.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null) return null;

        return new MedicalReportDTO
        {
            Id = report.Id,
            PatientId = report.PatientId,
            PatientName = report.Patient.Name,
            DoctorId = report.DoctorId,
            DoctorName = report.Doctor?.Name,
            ReportType = report.ReportType,
            ReportData = report.ReportData,
            Summary = report.Summary,
            ReportDate = report.ReportDate,
            CreatedAt = report.CreatedAt
        };
    }

    public async Task<MedicalReportDTO?> RegenerateReportSummaryAsync(int reportId)
    {
        var report = await _context.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            return null;
        }

        var summaryContext = await BuildReportSummaryContextAsync(report.PatientId, report.DoctorId, report.ReportType, report.ReportData);
        report.Summary = await _aiService.GenerateReportSummaryAsync(summaryContext);
        await _context.SaveChangesAsync();

        return new MedicalReportDTO
        {
            Id = report.Id,
            PatientId = report.PatientId,
            PatientName = report.Patient.Name,
            DoctorId = report.DoctorId,
            DoctorName = report.Doctor?.Name,
            ReportType = report.ReportType,
            ReportData = report.ReportData,
            Summary = report.Summary,
            ReportDate = report.ReportDate,
            CreatedAt = report.CreatedAt
        };
    }

    private async Task<string> BuildReportSummaryContextAsync(int patientId, int? doctorId, string reportType, string reportBody)
    {
        var sb = new StringBuilder();
        sb.AppendLine("REPORT TYPE");
        sb.AppendLine(string.IsNullOrWhiteSpace(reportType) ? "—" : reportType.Trim());
        sb.AppendLine();

        // Symptoms from most recent queue entry (if exists)
        string? queueSymptoms = null;
        if (doctorId.HasValue)
        {
            queueSymptoms = await _context.QueueEntries
                .Where(q => q.PatientId == patientId && q.DoctorId == doctorId.Value)
                .OrderByDescending(q => q.ArrivalTime)
                .Select(q => q.Symptoms)
                .FirstOrDefaultAsync();
        }
        else
        {
            queueSymptoms = await _context.QueueEntries
                .Where(q => q.PatientId == patientId)
                .OrderByDescending(q => q.ArrivalTime)
                .Select(q => q.Symptoms)
                .FirstOrDefaultAsync();
        }

        if (!string.IsNullOrWhiteSpace(queueSymptoms))
        {
            sb.AppendLine("Appointment symptoms");
            sb.AppendLine(queueSymptoms.Trim());
            sb.AppendLine();
        }

        // Latest sensor data
        var latestVitals = await _context.SensorData
            .Where(s => s.PatientId == patientId)
            .OrderByDescending(s => s.RecordedAt)
            .FirstOrDefaultAsync();

        if (latestVitals != null)
        {
            sb.AppendLine("Sensor data (latest)");
            sb.AppendLine($"Recorded: {latestVitals.RecordedAt:O}");
            sb.AppendLine($"Temperature: {(latestVitals.Temperature.HasValue ? $"{latestVitals.Temperature.Value:F1} °F" : "—")}");
            sb.AppendLine($"Pulse: {(latestVitals.HeartRate.HasValue ? $"{latestVitals.HeartRate.Value:F0} BPM" : "—")}");
            sb.AppendLine($"Blood pressure: {(latestVitals.BloodPressureSystolic.HasValue && latestVitals.BloodPressureDiastolic.HasValue ? $"{latestVitals.BloodPressureSystolic.Value:F0}/{latestVitals.BloodPressureDiastolic.Value:F0} mmHg" : "—")}");
            sb.AppendLine($"SpO₂: {(latestVitals.OxygenSaturation.HasValue ? $"{latestVitals.OxygenSaturation.Value:F0}%" : "—")}");
            sb.AppendLine();
        }

        sb.AppendLine("DETAILED FINDINGS (doctor-entered)");
        sb.AppendLine(string.IsNullOrWhiteSpace(reportBody) ? "—" : reportBody.Trim());
        return sb.ToString();
    }
}
