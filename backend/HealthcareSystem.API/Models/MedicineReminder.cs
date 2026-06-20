namespace HealthcareSystem.API.Models;

public class MedicineReminder
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int PrescriptionItemId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public TimeSpan ReminderTime { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public DateTime ReminderDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
}
