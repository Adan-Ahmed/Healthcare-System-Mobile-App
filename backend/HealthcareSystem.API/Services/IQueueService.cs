using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IQueueService
{
    Task<QueueEntryDTO> JoinQueueAsync(int patientId, JoinQueueRequest request);
    Task<List<QueueEntryDTO>> GetQueueAsync(int? doctorId = null);
    Task<QueueEntryDTO?> GetQueueEntryAsync(int queueEntryId);
}
