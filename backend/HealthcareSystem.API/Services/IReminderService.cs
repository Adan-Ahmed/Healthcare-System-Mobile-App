using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IReminderService
{
    Task<List<MedicineReminderDTO>> GetPatientRemindersAsync(int patientId);
    Task<MedicineReminderDTO?> UpdateReminderStatusAsync(int reminderId, UpdateReminderRequest request);
    Task CreateRemindersForPrescriptionAsync(int patientId, int prescriptionItemId, string medicineName, string dosage, TimeSpan reminderTime, int durationDays);
}
