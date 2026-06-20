namespace HealthcareSystem.API.Models;

public class Symptom
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string SymptomDescription { get; set; } = string.Empty;
    public string? Severity { get; set; } // Mild, Moderate, Severe
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
}
