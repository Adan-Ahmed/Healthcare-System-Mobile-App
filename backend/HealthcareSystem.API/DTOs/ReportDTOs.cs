namespace HealthcareSystem.API.DTOs;

public class MedicalReportDTO
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public string ReportData { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public DateTime ReportDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateReportRequest
{
    public int PatientId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public string ReportData { get; set; } = string.Empty;
}
