namespace HealthcareSystem.API.Models;

public class MedicalReport
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int? DoctorId { get; set; }
    public string ReportType { get; set; } = string.Empty; // Lab, X-Ray, CT Scan, etc.
    public string ReportData { get; set; } = string.Empty; // JSON or text data
    public string? Summary { get; set; } // AI-generated summary
    public DateTime ReportDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
    public Doctor? Doctor { get; set; }
}
