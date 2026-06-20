using System;

namespace HealthcareSystem.API.Models;

public class HttpAuditLog
{
    public long Id { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    // Correlation id to group a request/response "transaction"
    public string TransactionId { get; set; } = "";

    public string Method { get; set; } = "";
    public string Path { get; set; } = "";
    public string? QueryString { get; set; }

    public int StatusCode { get; set; }
    public long DurationMs { get; set; }

    public string? RemoteIp { get; set; }
    public string? UserId { get; set; }
    public string? UserAgent { get; set; }

    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }
}

