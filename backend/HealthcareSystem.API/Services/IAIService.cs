using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IAIService
{
    /// <summary>
    /// Single triage pass: priority score + critical factors (rules, optional LLM if AI:ApiKey is set).
    /// </summary>
    Task<TriageAnalysisResult> AnalyzeTriageAsync(
        int patientId,
        List<string> symptoms,
        SensorDataRequest? sensorData,
        CancellationToken cancellationToken = default);

    Task<string> GenerateReportSummaryAsync(string reportData);
}
