namespace HealthcareSystem.API.Models;

public class PrescriptionItem
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty; // e.g., "3 times a day", "Once daily"
    public int Duration { get; set; } // Duration in days
    public string? Instructions { get; set; }

    // Navigation Properties
    public Prescription Prescription { get; set; } = null!;
}
