namespace HealthcareSystem.API.DTOs;

public class PatientDTO
{
    public int Id { get; set; }
    public string CNIC { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? Gender { get; set; }
}

public class SymptomInputRequest
{
    public string SymptomDescription { get; set; } = string.Empty;
    public string? Severity { get; set; }
}

public class SensorDataRequest
{
    public double? Temperature { get; set; }
    public double? HeartRate { get; set; }
    public double? BloodPressureSystolic { get; set; }
    public double? BloodPressureDiastolic { get; set; }
    public double? OxygenSaturation { get; set; }
    public string? AdditionalData { get; set; }
}

public class SensorDataSnapshotDto
{
    public double? Temperature { get; set; }
    public double? HeartRate { get; set; }
    public double? BloodPressureSystolic { get; set; }
    public double? BloodPressureDiastolic { get; set; }
    public double? OxygenSaturation { get; set; }
    public DateTime RecordedAt { get; set; }
}

public class ReceptionistCreatePatientRequest
{
    public string CNIC { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? Gender { get; set; }
    public string Password { get; set; } = string.Empty;
}
