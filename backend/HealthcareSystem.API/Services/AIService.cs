using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public class AIService : IAIService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AIService> _logger;

    public AIService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<AIService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<TriageAnalysisResult> AnalyzeTriageAsync(
        int patientId,
        List<string> symptoms,
        SensorDataRequest? sensorData,
        CancellationToken cancellationToken = default)
    {
        var rules = ComputeRuleBasedTriage(symptoms, sensorData);

        var apiKey = _configuration["AI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return rules;
        }

        try
        {
            var llm = await TryLlmTriageAsync(symptoms, sensorData, apiKey, cancellationToken);
            if (llm == null)
            {
                return rules;
            }

            // Prefer the higher score so rule-based safety signals are not dropped.
            var score = Math.Max(rules.PriorityScore, llm.Value.Score);
            var factors = string.IsNullOrWhiteSpace(llm.Value.Factors)
                ? rules.CriticalFactors
                : $"{llm.Value.Factors}; {rules.CriticalFactors}".Trim(';', ' ');

            return new TriageAnalysisResult
            {
                PriorityScore = Math.Clamp(score, 0, 100),
                CriticalFactors = factors.Length > 500 ? factors[..500] : factors,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM triage failed; using rule-based triage only.");
            return rules;
        }
    }

    private TriageAnalysisResult ComputeRuleBasedTriage(List<string> symptoms, SensorDataRequest? sensorData)
    {
        var score = 50;
        var factors = new List<string>();

        var criticalKeywords = new[]
        {
            "chest pain", "difficulty breathing", "shortness of breath", "severe", "bleeding", "unconscious",
            "fever", "high temperature", "stroke", "allergy", "anaphylaxis",
        };

        foreach (var symptom in symptoms)
        {
            var lower = symptom.ToLowerInvariant();
            if (criticalKeywords.Any(k => lower.Contains(k)))
            {
                score += 28;
                factors.Add($"Symptom flag: {symptom.Trim()}");
            }
        }

        if (sensorData != null)
        {
            // App stores temperature in Fahrenheit.
            // 38.5°C ≈ 101.3°F, 37.8°C ≈ 100.0°F
            if (sensorData.Temperature is > 101.3)
            {
                score += 25;
                factors.Add($"High temperature: {sensorData.Temperature:F1}°F");
            }
            else if (sensorData.Temperature is > 100.0)
            {
                score += 10;
                factors.Add($"Elevated temperature: {sensorData.Temperature:F1}°F");
            }

            if (sensorData.HeartRate is > 100)
            {
                score += 18;
                factors.Add($"Tachycardia: {sensorData.HeartRate} BPM");
            }
            else if (sensorData.HeartRate is < 50)
            {
                score += 12;
                factors.Add($"Bradycardia: {sensorData.HeartRate} BPM");
            }

            if (sensorData.BloodPressureSystolic is > 140 || sensorData.BloodPressureDiastolic is > 90)
            {
                score += 16;
                factors.Add($"Elevated BP: {sensorData.BloodPressureSystolic}/{sensorData.BloodPressureDiastolic} mmHg");
            }
            else if (sensorData.BloodPressureSystolic is < 90)
            {
                score += 20;
                factors.Add($"Hypotension (sys): {sensorData.BloodPressureSystolic} mmHg");
            }

            if (sensorData.OxygenSaturation is < 95)
            {
                score += 35;
                factors.Add($"Low SpO₂: {sensorData.OxygenSaturation:F0}%");
            }
        }

        score = Math.Clamp(score, 0, 100);
        var factorsText = factors.Count > 0
            ? string.Join("; ", factors.Distinct())
            : "No critical factors identified";

        return new TriageAnalysisResult { PriorityScore = score, CriticalFactors = factorsText };
    }

    private async Task<(int Score, string Factors)?> TryLlmTriageAsync(
        List<string> symptoms,
        SensorDataRequest? sensorData,
        string apiKey,
        CancellationToken cancellationToken)
    {
        var url = _configuration["AI:ChatUrl"] ?? "https://api.groq.com/openai/v1/chat/completions";
        var model = _configuration["AI:Model"] ?? "llama-3.1-8b-instant";

        var vitals = sensorData == null
            ? "Not provided"
            : $"Temp °F: {sensorData.Temperature?.ToString() ?? "n/a"}, Pulse BPM: {sensorData.HeartRate?.ToString() ?? "n/a"}, BP mmHg: {sensorData.BloodPressureSystolic}/{sensorData.BloodPressureDiastolic}, SpO₂ %: {sensorData.OxygenSaturation?.ToString() ?? "n/a"}";

        var userPrompt =
            "You are an emergency triage assistant. Respond with ONLY valid JSON (no markdown), shape: " +
            "{\"priorityScore\":<integer 0-100>,\"criticalFactors\":\"<short semicolon-separated labels>\"}\n" +
            "Symptoms: " + string.Join("; ", symptoms) + "\n" +
            "Vitals: " + vitals + "\n" +
            "Higher priority = seen sooner. Be conservative for chest pain, breathing difficulty, low SpO2, very high fever (Temp is °F).";

        var payload = new
        {
            model,
            messages = new object[]
            {
                new { role = "system", content = "Output only JSON. No prose." },
                new { role = "user", content = userPrompt },
            },
            temperature = 0.2,
            max_tokens = 200,
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        client.Timeout = TimeSpan.FromSeconds(20);

        using var response = await client.PostAsync(
            url,
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("LLM HTTP {Status}: {Body}", (int)response.StatusCode, err);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        content = ExtractJsonObject(content);
        var parsed = JsonSerializer.Deserialize<LlmTriageJson>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        });

        if (parsed?.PriorityScore is null)
        {
            return null;
        }

        return (Math.Clamp(parsed.PriorityScore.Value, 0, 100), parsed.CriticalFactors ?? string.Empty);
    }

    private static string ExtractJsonObject(string content)
    {
        content = content.Trim();
        var start = content.IndexOf('{');
        var end = content.LastIndexOf('}');
        if (start >= 0 && end > start)
        {
            return content[start..(end + 1)];
        }

        return content;
    }

    private sealed class LlmTriageJson
    {
        [JsonPropertyName("priorityScore")]
        public int? PriorityScore { get; set; }

        [JsonPropertyName("criticalFactors")]
        public string? CriticalFactors { get; set; }
    }

    public async Task<string> GenerateReportSummaryAsync(string reportData)
    {
        if (string.IsNullOrWhiteSpace(reportData))
        {
            return "No clinical content was provided for summarization.";
        }

        var apiKey = _configuration["AI:ApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var llm = await TryLlmReportSummaryAsync(reportData, apiKey, CancellationToken.None);
                if (!string.IsNullOrWhiteSpace(llm))
                {
                    return llm.Trim();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LLM medical report summary failed; using structured fallback.");
            }
        }

        return BuildFallbackReportSummary(reportData);
    }

    private static string BuildFallbackReportSummary(string reportData)
    {
        var lower = reportData.ToLowerInvariant();

        static string? TryExtractLineAfter(string haystack, string marker)
        {
            var idx = haystack.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return null;
            var after = haystack.Substring(idx + marker.Length);
            var lines = after.Replace("\r\n", "\n").Split('\n');
            if (lines.Length < 2) return null;
            var value = lines[1].Trim();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        static Dictionary<string, string> TryExtractVitals(string haystack)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var idx = haystack.IndexOf("Sensor data (latest)", StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return result;

            var after = haystack.Substring(idx);
            var lines = after.Replace("\r\n", "\n").Split('\n')
                .Select(l => l.Trim())
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .Take(20)
                .ToList();

            foreach (var l in lines)
            {
                var sep = l.IndexOf(':');
                if (sep <= 0) continue;
                var key = l.Substring(0, sep).Trim();
                var val = l.Substring(sep + 1).Trim();
                if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(val))
                {
                    result[key] = val;
                }
            }

            return result;
        }

        var symptoms = TryExtractLineAfter(reportData, "Appointment symptoms");
        var vitals = TryExtractVitals(reportData);

        var linesOut = new List<string>
        {
            "KEY FINDINGS",
        };

        if (!string.IsNullOrWhiteSpace(symptoms) && symptoms != "—")
        {
            linesOut.Add($"• Symptoms (as documented): {symptoms}");
        }

        if (vitals.Count > 0)
        {
            var orderedKeys = new[] { "Recorded", "Temperature", "Pulse", "Blood pressure", "SpO₂", "SpO2" };
            var vitalsParts = new List<string>();
            foreach (var k in orderedKeys)
            {
                if (vitals.TryGetValue(k, out var v) && v != "—")
                {
                    vitalsParts.Add($"{k}: {v}");
                }
            }
            foreach (var kv in vitals)
            {
                if (orderedKeys.Contains(kv.Key, StringComparer.OrdinalIgnoreCase)) continue;
                if (kv.Value == "—") continue;
                vitalsParts.Add($"{kv.Key}: {kv.Value}");
            }
            if (vitalsParts.Count > 0)
            {
                linesOut.Add("• Latest sensor data (as documented): " + string.Join("; ", vitalsParts));
            }
        }

        linesOut.Add("• Source report contains detailed findings; review the full report body for exact values, timelines, and context.");

        linesOut.Add("");
        linesOut.Add("CLINICAL IMPRESSION");
        if (lower.Contains("abnormal") || lower.Contains("elevated") || lower.Contains("positive"))
        {
            linesOut.Add("Findings may include flagged or abnormal elements per the source text. Correlate clinically and verify against primary data in the detailed report.");
        }
        else
        {
            linesOut.Add("Clinical impression is not explicitly stated in the provided text; interpret in context of the detailed report.");
        }

        linesOut.Add("");
        linesOut.Add("RECOMMENDATIONS / FOLLOW-UP");
        linesOut.Add("• See attending physician for interpretation and plan based on full findings and clinical context.");

        return string.Join("\n", linesOut);
    }

    private async Task<string?> TryLlmReportSummaryAsync(string reportData, string apiKey, CancellationToken cancellationToken)
    {
        var url = _configuration["AI:ChatUrl"] ?? "https://api.groq.com/openai/v1/chat/completions";
        var model = _configuration["AI:Model"] ?? "llama-3.1-8b-instant";

        var clipped = reportData.Length > 12000 ? reportData[..12000] + "\n[…truncated…]" : reportData;

        var userPrompt =
            "You are a senior hospital medical documentation assistant (tertiary-care style: clear, formal, concise).\n" +
            "Summarize ONLY what is supported by the report text below. Do not invent diagnoses, values, or tests.\n" +
            "If the report contains a section named \"Appointment symptoms\" and/or \"Sensor data (latest)\", you MUST include:\n" +
            "- a bullet under KEY FINDINGS listing ALL symptoms as written\n" +
            "- a bullet under KEY FINDINGS listing ALL available sensor values exactly as written (Temp/Pulse/BP/SpO₂/Recorded)\n" +
            "Output plain text with these labeled sections (use these exact headings):\n" +
            "KEY FINDINGS\n" +
            "(bullet lines)\n\n" +
            "CLINICAL IMPRESSION\n" +
            "(short paragraph)\n\n" +
            "RECOMMENDATIONS / FOLLOW-UP\n" +
            "(bullet lines, or \"See attending physician\" if nothing stated)\n\n" +
            "If the content is not medical, say so under KEY FINDINGS.\n\n" +
            "--- REPORT ---\n" +
            clipped;

        var payload = new
        {
            model,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You write professional clinical summaries for hospital records. No markdown code fences. No disclaimers about being an AI.",
                },
                new { role = "user", content = userPrompt },
            },
            temperature = 0.25,
            max_tokens = 600,
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        client.Timeout = TimeSpan.FromSeconds(45);

        using var response = await client.PostAsync(
            url,
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("LLM report summary HTTP {Status}: {Body}", (int)response.StatusCode, err);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        return string.IsNullOrWhiteSpace(content) ? null : content.Trim();
    }
}
