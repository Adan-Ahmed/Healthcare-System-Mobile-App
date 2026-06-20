using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace HealthcareSystem.API.Services;

public class DoctorService : IDoctorService
{
    private readonly HealthcareDbContext _context;

    public DoctorService(HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<QueueEntryDTO>> GetQueueEntriesAsync(int doctorId)
    {
        var entries = await _context.QueueEntries
            .Include(q => q.Patient)
            .Include(q => q.Doctor)
            .Where(q => q.DoctorId == doctorId && (q.Status == "Waiting" || q.Status == "InProgress"))
            .OrderByDescending(q => q.PriorityScore)
            .ThenBy(q => q.ArrivalTime)
            .ToListAsync();

        return entries.Select(e => new QueueEntryDTO
        {
            Id = e.Id,
            PatientId = e.PatientId,
            PatientName = e.Patient.Name,
            PatientCNIC = e.Patient.CNIC,
            DoctorId = e.DoctorId,
            DoctorName = e.Doctor?.Name,
            PriorityScore = e.PriorityScore,
            Status = e.Status,
            ArrivalTime = e.ArrivalTime,
            ConsultationStartTime = e.ConsultationStartTime,
            ConsultationEndTime = e.ConsultationEndTime,
            Symptoms = e.Symptoms,
            CriticalFactors = e.CriticalFactors
        }).ToList();
    }

    public async Task<List<QueueEntryDTO>> GetCompletedConsultationsAsync(
        int doctorId,
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? take = null)
    {
        var query = _context.QueueEntries
            .Include(q => q.Patient)
            .Include(q => q.Doctor)
            .Where(q => q.DoctorId == doctorId && q.Status == "Completed");

        if (fromUtc.HasValue)
        {
            query = query.Where(q => q.ConsultationEndTime != null && q.ConsultationEndTime >= fromUtc.Value);
        }

        if (toUtc.HasValue)
        {
            query = query.Where(q => q.ConsultationEndTime != null && q.ConsultationEndTime < toUtc.Value);
        }

        query = query.OrderByDescending(q => q.ConsultationEndTime ?? DateTime.MinValue);

        if (take.HasValue && take.Value > 0)
        {
            query = query.Take(take.Value);
        }

        var entries = await query.ToListAsync();

        return entries.Select(e => new QueueEntryDTO
        {
            Id = e.Id,
            PatientId = e.PatientId,
            PatientName = e.Patient.Name,
            PatientCNIC = e.Patient.CNIC,
            DoctorId = e.DoctorId,
            DoctorName = e.Doctor?.Name,
            PriorityScore = e.PriorityScore,
            Status = e.Status,
            ArrivalTime = e.ArrivalTime,
            ConsultationStartTime = e.ConsultationStartTime,
            ConsultationEndTime = e.ConsultationEndTime,
            Symptoms = e.Symptoms,
            CriticalFactors = e.CriticalFactors
        }).ToList();
    }

    public async Task<bool> StartConsultationAsync(int queueEntryId, int doctorId)
    {
        var entry = await _context.QueueEntries
            .FirstOrDefaultAsync(q => q.Id == queueEntryId && q.DoctorId == doctorId);

        if (entry == null) return false;

        entry.Status = "InProgress";
        entry.ConsultationStartTime = DateTime.UtcNow;
        entry.DoctorId = doctorId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompleteConsultationAsync(int queueEntryId, int doctorId)
    {
        var entry = await _context.QueueEntries
            .FirstOrDefaultAsync(q => q.Id == queueEntryId && q.DoctorId == doctorId);

        if (entry == null) return false;
        if (entry.Status != "InProgress") return false;

        entry.Status = "Completed";
        entry.ConsultationEndTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}
