namespace HealthcareSystem.API.Models;

public class QueueEntry
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int? DoctorId { get; set; }
    public int PriorityScore { get; set; } // AI-calculated priority
    public string Status { get; set; } = "Waiting"; // Waiting, InProgress, Completed
    public DateTime ArrivalTime { get; set; } = DateTime.UtcNow;
    public DateTime? ConsultationStartTime { get; set; }
    public DateTime? ConsultationEndTime { get; set; }
    public string? Symptoms { get; set; }
    public string? CriticalFactors { get; set; } // AI-identified critical factors

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
    public Doctor? Doctor { get; set; }
}
