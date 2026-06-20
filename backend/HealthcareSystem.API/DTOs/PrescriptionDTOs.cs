namespace HealthcareSystem.API.DTOs;

public class PrescriptionDTO
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string? Instructions { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public List<PrescriptionItemDTO> Items { get; set; } = new();
}

public class PrescriptionItemDTO
{
    public int Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Instructions { get; set; }
}

public class CreatePrescriptionRequest
{
    public int PatientId { get; set; }
    public string? Diagnosis { get; set; }
    public string? Instructions { get; set; }
    public List<CreatePrescriptionItemRequest> Items { get; set; } = new();
}

public class CreatePrescriptionItemRequest
{
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Duration { get; set; }
    public string? Instructions { get; set; }
    public TimeSpan? ReminderTime { get; set; }
}
