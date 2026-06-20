using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IPrescriptionService
{
    Task<PrescriptionDTO> CreatePrescriptionAsync(int doctorId, CreatePrescriptionRequest request);
    Task<List<PrescriptionDTO>> GetPatientPrescriptionsAsync(int patientId);
    Task<PrescriptionDTO?> GetPrescriptionAsync(int prescriptionId);
}
