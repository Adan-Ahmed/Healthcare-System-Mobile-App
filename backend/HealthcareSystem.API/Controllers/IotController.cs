using HealthcareSystem.API.DTOs;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthcareSystem.API.Controllers;

/// <summary>
/// IoT / device integration. Dummy endpoint returns sample vitals until a real device API is wired.
/// </summary>
[ApiController]
[Route("api/[controller]")]
//[Authorize(Roles = "Receptionist")]
public class IotController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IotController> _logger;

    public IotController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<IotController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("temperature")]
    public async Task<ActionResult<TemperatureResponse>> GetTemperature()
    {
        double temp = 98.8;
        return Ok(new TemperatureResponse
        {
            Temperature = temp,
            Source = "iot-device",
            RecordedAtUtc = DateTime.UtcNow,
        });
        var payloadResult = await GetJsonFromDeviceAsync("temperature");
        if (payloadResult == null)
        {
            return StatusCode(502, new { message = "Could not fetch temperature from IoT device." });
        }
        var payload = payloadResult.Value;

        if (!payload.TryGetProperty("temperature_F", out var value) || !value.TryGetDouble(out var temperature))
        {
            return StatusCode(502, new { message = "IoT temperature payload is invalid." });
        }

        return Ok(new TemperatureResponse
        {
            Temperature = temperature,
            Source = "iot-device",
            RecordedAtUtc = DateTime.UtcNow,
        });
    }

    [HttpGet("pulse")]
    public async Task<ActionResult<PulseResponse>> GetPulse()
    {
        double temp = 65.4;
        return Ok(new PulseResponse
        {
            Pulse = temp,
            Source = "iot-device",
            RecordedAtUtc = DateTime.UtcNow,
        });
        var payloadResult = await GetJsonFromDeviceAsync("pulse");
        if (payloadResult == null)
        {
            return StatusCode(502, new { message = "Could not fetch pulse from IoT device." });
        }
        var payload = payloadResult.Value;

        if (!payload.TryGetProperty("pulse_BPM", out var value) || !value.TryGetDouble(out var pulse))
        {
            return StatusCode(502, new { message = "IoT pulse payload is invalid." });
        }

        return Ok(new PulseResponse
        {
            Pulse = pulse,
            Source = "iot-device",
            RecordedAtUtc = DateTime.UtcNow,
        });
    }

    [HttpGet("bp")]
    public async Task<ActionResult<BloodPressureResponse>> GetBloodPressure()
    {
        double temp = 91.6;
        double temp2 = 145.9;
        return Ok(new BloodPressureResponse
        {
            BpUp = temp,
            BpDown = temp2,
            Source = "iot-device",
            RecordedAtUtc = DateTime.UtcNow,
        });
        var payloadResult = await GetJsonFromDeviceAsync("bp");
        if (payloadResult == null)
        {
            return StatusCode(502, new { message = "Could not fetch blood pressure from IoT device." });
        }
        var payload = payloadResult.Value;

        if (!payload.TryGetProperty("systolic", out var upValue) ||
            !upValue.TryGetDouble(out var bpUp) ||
            !payload.TryGetProperty("diastolic", out var downValue) ||
            !downValue.TryGetDouble(out var bpDown))
        {
            return StatusCode(502, new { message = "IoT blood pressure payload is invalid." });
        }

        return Ok(new BloodPressureResponse
        {
            BpUp = bpUp,
            BpDown = bpDown,
            Source = "iot-device",
            RecordedAtUtc = DateTime.UtcNow,
        });
    }

    private async Task<JsonElement?> GetJsonFromDeviceAsync(string path)
    {
        var baseUrl = _configuration["IotDevice:BaseUrl"]?.TrimEnd('/')
                      ?? "http://192.168.100.202";

        try
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{baseUrl}/{path}");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("IoT endpoint {Url} returned {StatusCode}", $"{baseUrl}/{path}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(content);
            return document.RootElement.Clone();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling IoT endpoint {Path}", path);
            return null;
        }
    }
}
