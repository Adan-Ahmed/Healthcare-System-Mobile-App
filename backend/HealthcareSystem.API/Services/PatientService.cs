using HealthcareSystem.API.Data;
using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HealthcareSystem.API.Services;

public class PatientService : IPatientService
{
    private readonly HealthcareDbContext _context;

    public PatientService(HealthcareDbContext context)
    {
        _context = context;
    }

    public async Task<PatientDTO?> GetPatientByCNICAsync(string cnic)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.CNIC == cnic);

        if (patient == null) return null;

        return new PatientDTO
        {
            Id = patient.Id,
            CNIC = patient.CNIC,
            Name = patient.Name,
            Email = patient.Email,
            PhoneNumber = patient.PhoneNumber,
            DateOfBirth = patient.DateOfBirth,
            Address = patient.Address,
            Gender = patient.Gender
        };
    }

    public async Task<PatientDTO?> GetPatientByIdAsync(int id)
    {
        var patient = await _context.Patients.FindAsync(id);

        if (patient == null) return null;

        return new PatientDTO
        {
            Id = patient.Id,
            CNIC = patient.CNIC,
            Name = patient.Name,
            Email = patient.Email,
            PhoneNumber = patient.PhoneNumber,
            DateOfBirth = patient.DateOfBirth,
            Address = patient.Address,
            Gender = patient.Gender
        };
    }

    public async Task<int> AddSymptomAsync(int patientId, SymptomInputRequest request)
    {
        var symptom = new Symptom
        {
            PatientId = patientId,
            SymptomDescription = request.SymptomDescription,
            Severity = request.Severity,
            RecordedAt = DateTime.UtcNow
        };

        _context.Symptoms.Add(symptom);
        await _context.SaveChangesAsync();

        return symptom.Id;
    }

    public async Task<int> AddSensorDataAsync(int patientId, SensorDataRequest request)
    {
        var sensorData = new SensorData
        {
            PatientId = patientId,
            Temperature = request.Temperature,
            HeartRate = request.HeartRate,
            BloodPressureSystolic = request.BloodPressureSystolic,
            BloodPressureDiastolic = request.BloodPressureDiastolic,
            OxygenSaturation = request.OxygenSaturation,
            AdditionalData = request.AdditionalData,
            RecordedAt = DateTime.UtcNow
        };

        _context.SensorData.Add(sensorData);
        await _context.SaveChangesAsync();

        return sensorData.Id;
    }

    public async Task<SensorDataSnapshotDto?> GetLatestSensorDataAsync(int patientId)
    {
        var row = await _context.SensorData
            .Where(s => s.PatientId == patientId)
            .OrderByDescending(s => s.RecordedAt)
            .FirstOrDefaultAsync();

        if (row == null)
        {
            return null;
        }

        return new SensorDataSnapshotDto
        {
            Temperature = row.Temperature,
            HeartRate = row.HeartRate,
            BloodPressureSystolic = row.BloodPressureSystolic,
            BloodPressureDiastolic = row.BloodPressureDiastolic,
            OxygenSaturation = row.OxygenSaturation,
            RecordedAt = row.RecordedAt
        };
    }

    public async Task<PatientDTO> CreatePatientByReceptionistAsync(ReceptionistCreatePatientRequest request)
    {
        if (await _context.Patients.AnyAsync(p => p.CNIC == request.CNIC))
        {
            throw new InvalidOperationException("A patient with this CNIC already exists.");
        }

        var patient = new Patient
        {
            CNIC = request.CNIC,
            Name = request.Name,
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            PhoneNumber = request.PhoneNumber,
            DateOfBirth = request.DateOfBirth,
            Address = request.Address,
            Gender = request.Gender,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            EmailVerified = true,
            EmailVerificationCodeHash = null,
            EmailVerificationExpiryUtc = null,
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return (await GetPatientByIdAsync(patient.Id))!;
    }
}
