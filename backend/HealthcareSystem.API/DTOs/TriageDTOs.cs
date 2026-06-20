namespace HealthcareSystem.API.DTOs;

public class TriageAnalysisResult
{
    public int PriorityScore { get; set; }
    public string CriticalFactors { get; set; } = string.Empty;
}
