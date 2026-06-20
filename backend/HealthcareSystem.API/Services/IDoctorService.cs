using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IDoctorService
{
    Task<List<QueueEntryDTO>> GetQueueEntriesAsync(int doctorId);
    Task<List<QueueEntryDTO>> GetCompletedConsultationsAsync(int doctorId, DateTime? fromUtc = null, DateTime? toUtc = null, int? take = null);
    Task<bool> StartConsultationAsync(int queueEntryId, int doctorId);
    Task<bool> CompleteConsultationAsync(int queueEntryId, int doctorId);
}
