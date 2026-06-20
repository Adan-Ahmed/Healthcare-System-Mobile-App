using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using HealthcareSystem.API.Data;
using HealthcareSystem.API.Models;
using Microsoft.AspNetCore.Http;

namespace HealthcareSystem.API.Middleware;

public sealed class HttpAuditMiddleware : IMiddleware
{
    private const int MaxBodyChars = 20_000;
    private static readonly string[] SensitiveKeys = { "password", "token", "authorization" };

    private readonly HealthcareDbContext _db;

    public HttpAuditMiddleware(HealthcareDbContext db)
    {
        _db = db;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Skip Swagger + static endpoints (keeps DB clean).
        var path = context.Request.Path.Value ?? "";
        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/favicon", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var transactionId = context.TraceIdentifier;
        context.Response.Headers.TryAdd("X-Transaction-Id", transactionId);

        context.Request.EnableBuffering();
        var requestBody = await ReadBodyAsString(context.Request.Body);
        context.Request.Body.Position = 0;

        var originalBody = context.Response.Body;
        await using var responseBuffer = new MemoryStream();
        context.Response.Body = responseBuffer;

        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();

            context.Response.Body.Position = 0;
            var responseBody = await ReadBodyAsString(context.Response.Body);
            context.Response.Body.Position = 0;

            await responseBuffer.CopyToAsync(originalBody);
            context.Response.Body = originalBody;

            // Audit logging must never break the API response.
            try
            {
                var userId =
                    context.User?.FindFirst("sub")?.Value ??
                    context.User?.FindFirst("id")?.Value ??
                    context.User?.FindFirst("userId")?.Value ??
                    context.User?.Identity?.Name;

                var log = new HttpAuditLog
                {
                    TransactionId = transactionId,
                    Method = context.Request.Method,
                    Path = context.Request.Path.ToString(),
                    QueryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
                    StatusCode = context.Response.StatusCode,
                    DurationMs = sw.ElapsedMilliseconds,
                    RemoteIp = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers.UserAgent.ToString(),
                    UserId = string.IsNullOrWhiteSpace(userId) ? null : userId,
                    RequestBody = RedactAndTruncate(requestBody),
                    ResponseBody = RedactAndTruncate(responseBody),
                };

                _db.HttpAuditLogs.Add(log);
                await _db.SaveChangesAsync();
            }
            catch
            {
                // swallow
            }
        }
    }

    private static async Task<string?> ReadBodyAsString(Stream body)
    {
        if (body == null) return null;
        using var reader = new StreamReader(body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        var text = await reader.ReadToEndAsync();
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private static string? RedactAndTruncate(string? body)
    {
        if (string.IsNullOrWhiteSpace(body)) return body;

        var normalized = body;

        try
        {
            using var doc = JsonDocument.Parse(body);
            var redacted = RedactJson(doc.RootElement);
            normalized = JsonSerializer.Serialize(redacted);
        }
        catch
        {
            // non-JSON; keep as-is
        }

        if (normalized.Length > MaxBodyChars)
        {
            normalized = normalized.Substring(0, MaxBodyChars) + "…(truncated)";
        }

        return normalized;
    }

    private static object? RedactJson(JsonElement el)
    {
        switch (el.ValueKind)
        {
            case JsonValueKind.Object:
                var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                foreach (var p in el.EnumerateObject())
                {
                    if (SensitiveKeys.Contains(p.Name, StringComparer.OrdinalIgnoreCase))
                    {
                        dict[p.Name] = "***REDACTED***";
                    }
                    else
                    {
                        dict[p.Name] = RedactJson(p.Value);
                    }
                }
                return dict;

            case JsonValueKind.Array:
                return el.EnumerateArray().Select(RedactJson).ToList();

            case JsonValueKind.String:
                return el.GetString();

            case JsonValueKind.Number:
                if (el.TryGetInt64(out var i)) return i;
                if (el.TryGetDouble(out var d)) return d;
                return el.GetRawText();

            case JsonValueKind.True:
            case JsonValueKind.False:
                return el.GetBoolean();

            case JsonValueKind.Null:
            case JsonValueKind.Undefined:
            default:
                return null;
        }
    }
}

