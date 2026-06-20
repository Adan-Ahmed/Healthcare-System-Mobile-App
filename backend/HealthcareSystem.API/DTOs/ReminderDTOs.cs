namespace HealthcareSystem.API.DTOs;

public class MedicineReminderDTO
{
    public int Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public TimeSpan ReminderTime { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime ReminderDate { get; set; }
}

public class UpdateReminderRequest
{
    public bool IsCompleted { get; set; }
}
