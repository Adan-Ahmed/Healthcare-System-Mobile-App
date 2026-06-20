using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IReportService
{
    Task<List<MedicalReportDTO>> GetPatientReportsAsync(int patientId);
    Task<MedicalReportDTO> CreateReportAsync(int doctorId, CreateReportRequest request);
    Task<MedicalReportDTO?> GetReportAsync(int reportId);
    /// <summary>Recomputes and saves AI summary; returns updated report.</summary>
    Task<MedicalReportDTO?> RegenerateReportSummaryAsync(int reportId);
}
