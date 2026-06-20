namespace HealthcareSystem.API.DTOs;

public class QueueEntryDTO
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientCNIC { get; set; } = string.Empty;
    public int? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public int PriorityScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ArrivalTime { get; set; }
    public DateTime? ConsultationStartTime { get; set; }
    public DateTime? ConsultationEndTime { get; set; }
    public string? Symptoms { get; set; }
    public string? CriticalFactors { get; set; }
}

public class JoinQueueRequest
{
    public int? PatientId { get; set; } // Optional: for receptionists to specify patient
    public List<string> Symptoms { get; set; } = new();
    public SensorDataRequest? SensorData { get; set; }
}
