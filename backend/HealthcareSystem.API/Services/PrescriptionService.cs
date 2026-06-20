using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HealthcareSystem.API.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly HealthcareDbContext _context;
    private readonly IReminderService _reminderService;

    public PrescriptionService(HealthcareDbContext context, IReminderService reminderService)
    {
        _context = context;
        _reminderService = reminderService;
    }

    public async Task<PrescriptionDTO> CreatePrescriptionAsync(int doctorId, CreatePrescriptionRequest request)
    {
        var prescription = new Prescription
        {
            PatientId = request.PatientId,
            DoctorId = doctorId,
            Diagnosis = request.Diagnosis,
            Instructions = request.Instructions,
            PrescriptionDate = DateTime.UtcNow
        };

        foreach (var itemRequest in request.Items)
        {
            var item = new PrescriptionItem
            {
                MedicineName = itemRequest.MedicineName,
                Dosage = itemRequest.Dosage,
                Frequency = itemRequest.Frequency,
                Duration = itemRequest.Duration,
                Instructions = itemRequest.Instructions
            };
            prescription.Items.Add(item);
        }

        _context.Prescriptions.Add(prescription);
        await _context.SaveChangesAsync();

        // Create reminders for each prescription item
        foreach (var item in prescription.Items)
        {
            if (request.Items.FirstOrDefault(i => i.MedicineName == item.MedicineName)?.ReminderTime != null)
            {
                var reminderTime = request.Items.First(i => i.MedicineName == item.MedicineName).ReminderTime!.Value;
                await _reminderService.CreateRemindersForPrescriptionAsync(
                    request.PatientId, 
                    item.Id, 
                    item.MedicineName, 
                    item.Dosage, 
                    reminderTime, 
                    item.Duration
                );
            }
        }

        var patient = await _context.Patients.FindAsync(request.PatientId);
        var doctor = await _context.Doctors.FindAsync(doctorId);

        return new PrescriptionDTO
        {
            Id = prescription.Id,
            PatientId = prescription.PatientId,
            PatientName = patient?.Name ?? "",
            DoctorId = prescription.DoctorId,
            DoctorName = doctor?.Name ?? "",
            Diagnosis = prescription.Diagnosis,
            Instructions = prescription.Instructions,
            PrescriptionDate = prescription.PrescriptionDate,
            Items = prescription.Items.Select(i => new PrescriptionItemDTO
            {
                Id = i.Id,
                MedicineName = i.MedicineName,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                Duration = i.Duration,
                Instructions = i.Instructions
            }).ToList()
        };
    }

    public async Task<List<PrescriptionDTO>> GetPatientPrescriptionsAsync(int patientId)
    {
        var prescriptions = await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor)
            .Include(p => p.Items)
            .Where(p => p.PatientId == patientId)
            .OrderByDescending(p => p.PrescriptionDate)
            .ToListAsync();

        return prescriptions.Select(p => new PrescriptionDTO
        {
            Id = p.Id,
            PatientId = p.PatientId,
            PatientName = p.Patient.Name,
            DoctorId = p.DoctorId,
            DoctorName = p.Doctor.Name,
            Diagnosis = p.Diagnosis,
            Instructions = p.Instructions,
            PrescriptionDate = p.PrescriptionDate,
            Items = p.Items.Select(i => new PrescriptionItemDTO
            {
                Id = i.Id,
                MedicineName = i.MedicineName,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                Duration = i.Duration,
                Instructions = i.Instructions
            }).ToList()
        }).ToList();
    }

    public async Task<PrescriptionDTO?> GetPrescriptionAsync(int prescriptionId)
    {
        var prescription = await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor)
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == prescriptionId);

        if (prescription == null) return null;

        return new PrescriptionDTO
        {
            Id = prescription.Id,
            PatientId = prescription.PatientId,
            PatientName = prescription.Patient.Name,
            DoctorId = prescription.DoctorId,
            DoctorName = prescription.Doctor.Name,
            Diagnosis = prescription.Diagnosis,
            Instructions = prescription.Instructions,
            PrescriptionDate = prescription.PrescriptionDate,
            Items = prescription.Items.Select(i => new PrescriptionItemDTO
            {
                Id = i.Id,
                MedicineName = i.MedicineName,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                Duration = i.Duration,
                Instructions = i.Instructions
            }).ToList()
        };
    }
}
