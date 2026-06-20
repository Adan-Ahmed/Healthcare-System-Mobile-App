namespace HealthcareSystem.API.DTOs;

public class TemperatureResponse
{
    public double Temperature { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime RecordedAtUtc { get; set; }
}

public class PulseResponse
{
    public double Pulse { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime RecordedAtUtc { get; set; }
}

public class BloodPressureResponse
{
    public double BpUp { get; set; }
    public double BpDown { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime RecordedAtUtc { get; set; }
}
