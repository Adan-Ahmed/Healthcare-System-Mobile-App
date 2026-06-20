namespace HealthcareSystem.API.Models;

public class SensorData
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public double? Temperature { get; set; } // Fahrenheit (°F)
    public double? HeartRate { get; set; } // BPM
    public double? BloodPressureSystolic { get; set; } // mmHg
    public double? BloodPressureDiastolic { get; set; } // mmHg
    public double? OxygenSaturation { get; set; } // Percentage
    public string? AdditionalData { get; set; } // JSON for other sensor readings
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
}
