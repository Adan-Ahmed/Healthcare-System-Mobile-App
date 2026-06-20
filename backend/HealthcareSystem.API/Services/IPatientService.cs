using HealthcareSystem.API.DTOs;

namespace HealthcareSystem.API.Services;

public interface IPatientService
{
    Task<PatientDTO?> GetPatientByCNICAsync(string cnic);
    Task<PatientDTO?> GetPatientByIdAsync(int id);
    Task<int> AddSymptomAsync(int patientId, SymptomInputRequest request);
    Task<int> AddSensorDataAsync(int patientId, SensorDataRequest request);
    Task<SensorDataSnapshotDto?> GetLatestSensorDataAsync(int patientId);
    Task<PatientDTO> CreatePatientByReceptionistAsync(ReceptionistCreatePatientRequest request);
}
