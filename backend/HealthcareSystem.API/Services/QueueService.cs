using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HealthcareSystem.API.Services;

public class QueueService : IQueueService
{
    private readonly HealthcareDbContext _context;
    private readonly IAIService _aiService;
    private readonly IPatientService _patientService;

    public QueueService(HealthcareDbContext context, IAIService aiService, IPatientService patientService)
    {
        _context = context;
        _aiService = aiService;
        _patientService = patientService;
    }

    public async Task<QueueEntryDTO> JoinQueueAsync(int patientId, JoinQueueRequest request)
    {
        var alreadyInQueue = await _context.QueueEntries.AnyAsync(q =>
            q.PatientId == patientId && (q.Status == "Waiting" || q.Status == "InProgress"));

        if (alreadyInQueue)
        {
            throw new InvalidOperationException(
                "This patient is already in the queue. Wait until their visit is completed before checking them in again.");
        }

        // Add symptoms
        foreach (var symptom in request.Symptoms)
        {
            await _patientService.AddSymptomAsync(patientId, new SymptomInputRequest
            {
                SymptomDescription = symptom,
                Severity = "Moderate"
            });
        }

        // Add sensor data if provided
        if (request.SensorData != null)
        {
            await _patientService.AddSensorDataAsync(patientId, request.SensorData);
        }

        var triage = await _aiService.AnalyzeTriageAsync(patientId, request.Symptoms, request.SensorData);
        var priorityScore = triage.PriorityScore;
        var criticalFactors = triage.CriticalFactors;

        // Automatic Doctor Assignment: Find the doctor with the shortest waiting queue
        var assignedDoctorId = await _context.Doctors
            .Where(d => d.IsActive)
            .Select(d => new
            {
                DoctorId = d.Id,
                WaitingCount = _context.QueueEntries.Count(q => q.DoctorId == d.Id && q.Status == "Waiting")
            })
            .OrderBy(x => x.WaitingCount)
            .Select(x => (int?)x.DoctorId)
            .FirstOrDefaultAsync();

        var queueEntry = new QueueEntry
        {
            PatientId = patientId,
            DoctorId = assignedDoctorId, // Automatically assigned
            PriorityScore = priorityScore,
            Status = "Waiting",
            ArrivalTime = DateTime.UtcNow,
            Symptoms = string.Join(", ", request.Symptoms),
            CriticalFactors = criticalFactors
        };

        _context.QueueEntries.Add(queueEntry);
        await _context.SaveChangesAsync();

        var patient = await _context.Patients.FindAsync(patientId);
        var doctor = assignedDoctorId.HasValue ? await _context.Doctors.FindAsync(assignedDoctorId.Value) : null;

        return new QueueEntryDTO
        {
            Id = queueEntry.Id,
            PatientId = queueEntry.PatientId,
            PatientName = patient?.Name ?? "",
            PatientCNIC = patient?.CNIC ?? "",
            DoctorId = queueEntry.DoctorId,
            DoctorName = doctor?.Name,
            PriorityScore = queueEntry.PriorityScore,
            Status = queueEntry.Status,
            ArrivalTime = queueEntry.ArrivalTime,
            Symptoms = queueEntry.Symptoms,
            CriticalFactors = queueEntry.CriticalFactors
        };
    }

    public async Task<List<QueueEntryDTO>> GetQueueAsync(int? doctorId = null)
    {
        var query = _context.QueueEntries
            .Include(q => q.Patient)
            .Include(q => q.Doctor)
            .Where(q => q.Status == "Waiting" || q.Status == "InProgress")
            .AsQueryable();

        if (doctorId.HasValue)
        {
            query = query.Where(q => q.DoctorId == doctorId);
        }

        var entries = await query
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

    public async Task<QueueEntryDTO?> GetQueueEntryAsync(int queueEntryId)
    {
        var entry = await _context.QueueEntries
            .Include(q => q.Patient)
            .Include(q => q.Doctor)
            .FirstOrDefaultAsync(q => q.Id == queueEntryId);

        if (entry == null) return null;

        return new QueueEntryDTO
        {
            Id = entry.Id,
            PatientId = entry.PatientId,
            PatientName = entry.Patient.Name,
            PatientCNIC = entry.Patient.CNIC,
            DoctorId = entry.DoctorId,
            DoctorName = entry.Doctor?.Name,
            PriorityScore = entry.PriorityScore,
            Status = entry.Status,
            ArrivalTime = entry.ArrivalTime,
            ConsultationStartTime = entry.ConsultationStartTime,
            ConsultationEndTime = entry.ConsultationEndTime,
            Symptoms = entry.Symptoms,
            CriticalFactors = entry.CriticalFactors
        };
    }
}
