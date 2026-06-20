using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HealthcareSystem.API.Services;

public class ReminderService : IReminderService
{
    private readonly HealthcareDbContext _context;

    public ReminderService(HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<List<MedicineReminderDTO>> GetPatientRemindersAsync(int patientId)
    {
        var reminders = await _context.MedicineReminders
            .Where(r => r.PatientId == patientId && r.ReminderDate >= DateTime.Today)
            .OrderBy(r => r.ReminderDate)
            .ThenBy(r => r.ReminderTime)
            .ToListAsync();

        return reminders.Select(r => new MedicineReminderDTO
        {
            Id = r.Id,
            MedicineName = r.MedicineName,
            Dosage = r.Dosage,
            ReminderTime = r.ReminderTime,
            IsCompleted = r.IsCompleted,
            CompletedAt = r.CompletedAt,
            ReminderDate = r.ReminderDate
        }).ToList();
    }

    public async Task<MedicineReminderDTO?> UpdateReminderStatusAsync(int reminderId, UpdateReminderRequest request)
    {
        var reminder = await _context.MedicineReminders.FindAsync(reminderId);
        if (reminder == null) return null;

        reminder.IsCompleted = request.IsCompleted;
        reminder.CompletedAt = request.IsCompleted ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync();

        return new MedicineReminderDTO
        {
            Id = reminder.Id,
            MedicineName = reminder.MedicineName,
            Dosage = reminder.Dosage,
            ReminderTime = reminder.ReminderTime,
            IsCompleted = reminder.IsCompleted,
            CompletedAt = reminder.CompletedAt,
            ReminderDate = reminder.ReminderDate
        };
    }

    public async Task CreateRemindersForPrescriptionAsync(int patientId, int prescriptionItemId, string medicineName, string dosage, TimeSpan reminderTime, int durationDays)
    {
        var reminders = new List<MedicineReminder>();

        for (int day = 0; day < durationDays; day++)
        {
            reminders.Add(new MedicineReminder
            {
                PatientId = patientId,
                PrescriptionItemId = prescriptionItemId,
                MedicineName = medicineName,
                Dosage = dosage,
                ReminderTime = reminderTime,
                ReminderDate = DateTime.Today.AddDays(day),
                IsCompleted = false
            });
        }

        _context.MedicineReminders.AddRange(reminders);
        await _context.SaveChangesAsync();
    }
}
