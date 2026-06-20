using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Data;
using HealthcareSystem.API.Models;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly HealthcareDbContext _context;

    public AdminController(IAuthService authService, HealthcareDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    // Doctors

    [HttpGet("doctors")]
    public async Task<ActionResult<List<AdminDoctorDto>>> GetDoctors()
    {
        var doctors = await _context.Doctors
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminDoctorDto
            {
                Id = d.Id,
                Name = d.Name,
                Specialization = d.Specialization,
                Email = d.Email,
                PhoneNumber = d.PhoneNumber,
                LicenseNumber = d.LicenseNumber,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();

        return Ok(doctors);
    }

    [HttpPost("doctors")]
    public async Task<ActionResult> CreateDoctor([FromBody] DoctorRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(request.Email)
            || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Name, email, and password are required." });
        }

        var success = await _authService.DoctorRegisterAsync(request);
        if (!success)
        {
            return BadRequest(new { message = "Doctor with this email already exists" });
        }

        return Ok(new { message = "Doctor created successfully" });
    }

    [HttpPut("doctors/{doctorId:int}")]
    public async Task<ActionResult> UpdateDoctor(int doctorId, [FromBody] AdminUpdateDoctorRequest request)
    {
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
        if (doctor == null)
        {
            return NotFound(new { message = "Doctor not found" });
        }

        if (request.Name != null) doctor.Name = request.Name.Trim();
        if (request.Specialization != null) doctor.Specialization = request.Specialization.Trim();
        if (request.Email != null) doctor.Email = request.Email.Trim();
        if (request.PhoneNumber != null) doctor.PhoneNumber = request.PhoneNumber.Trim();
        if (request.LicenseNumber != null) doctor.LicenseNumber = request.LicenseNumber.Trim();

        await _context.SaveChangesAsync();
        return Ok(new { message = "Doctor updated" });
    }

    [HttpPost("doctors/{doctorId:int}/active")]
    public async Task<ActionResult> SetDoctorActive(int doctorId, [FromBody] AdminSetActiveRequest request)
    {
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
        if (doctor == null)
        {
            return NotFound(new { message = "Doctor not found" });
        }

        doctor.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Doctor status updated" });
    }

    [HttpPost("doctors/{doctorId:int}/reset-password")]
    public async Task<ActionResult> ResetDoctorPassword(int doctorId, [FromBody] AdminResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Trim().Length < 6)
        {
            return BadRequest(new { message = "NewPassword must be at least 6 characters." });
        }

        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
        if (doctor == null)
        {
            return NotFound(new { message = "Doctor not found" });
        }

        doctor.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Doctor password reset" });
    }

    /// <summary>
    /// Register a receptionist for clinic desk login. Call <c>POST /api/auth/receptionist/login</c> with the same email and password.
    /// </summary>
    [HttpGet("receptionists")]
    public async Task<ActionResult<List<AdminReceptionistDto>>> GetReceptionists()
    {
        var receptionists = await _context.Receptionists
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new AdminReceptionistDto
            {
                Id = r.Id,
                Name = r.Name,
                Email = r.Email,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(receptionists);
    }

    [HttpPost("receptionists")]
    public async Task<ActionResult> CreateReceptionist([FromBody] ReceptionistRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(request.Email)
            || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Name, email, and password are required." });
        }

        var success = await _authService.ReceptionistRegisterAsync(request);
        if (!success)
        {
            return BadRequest(new { message = "A receptionist with this email already exists." });
        }

        return Ok(new { message = "Receptionist created successfully" });
    }

    [HttpPut("receptionists/{receptionistId:int}")]
    public async Task<ActionResult> UpdateReceptionist(int receptionistId, [FromBody] AdminUpdateReceptionistRequest request)
    {
        var rec = await _context.Receptionists.FirstOrDefaultAsync(r => r.Id == receptionistId);
        if (rec == null)
        {
            return NotFound(new { message = "Receptionist not found" });
        }

        if (request.Name != null) rec.Name = request.Name.Trim();
        if (request.Email != null) rec.Email = request.Email.Trim();

        await _context.SaveChangesAsync();
        return Ok(new { message = "Receptionist updated" });
    }

    [HttpPost("receptionists/{receptionistId:int}/active")]
    public async Task<ActionResult> SetReceptionistActive(int receptionistId, [FromBody] AdminSetActiveRequest request)
    {
        var rec = await _context.Receptionists.FirstOrDefaultAsync(r => r.Id == receptionistId);
        if (rec == null)
        {
            return NotFound(new { message = "Receptionist not found" });
        }

        rec.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Receptionist status updated" });
    }

    [HttpPost("receptionists/{receptionistId:int}/reset-password")]
    public async Task<ActionResult> ResetReceptionistPassword(int receptionistId, [FromBody] AdminResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Trim().Length < 6)
        {
            return BadRequest(new { message = "NewPassword must be at least 6 characters." });
        }

        var rec = await _context.Receptionists.FirstOrDefaultAsync(r => r.Id == receptionistId);
        if (rec == null)
        {
            return NotFound(new { message = "Receptionist not found" });
        }

        rec.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Receptionist password reset" });
    }

    // Operational view

    [HttpGet("queue")]
    public async Task<ActionResult<List<QueueEntryDTO>>> GetAllActiveQueue()
    {
        var entries = await _context.QueueEntries
            .Include(q => q.Patient)
            .Include(q => q.Doctor)
            .Where(q => q.Status == "Waiting" || q.Status == "InProgress")
            .OrderByDescending(q => q.PriorityScore)
            .ThenBy(q => q.ArrivalTime)
            .ToListAsync();

        return Ok(entries.Select(e => new QueueEntryDTO
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
        }).ToList());
    }

    // Patients + medical history

    [HttpGet("patients")]
    public async Task<ActionResult<List<AdminPatientDto>>> GetPatients()
    {
        var patients = await _context.Patients
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new AdminPatientDto
            {
                Id = p.Id,
                Name = p.Name,
                CNIC = p.CNIC,
                Email = p.Email,
                PhoneNumber = p.PhoneNumber,
                DateOfBirth = p.DateOfBirth,
                Gender = p.Gender,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(patients);
    }

    [HttpGet("patients/{patientId:int}/history")]
    public async Task<ActionResult<AdminPatientHistoryDto>> GetPatientHistory(int patientId)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
        if (patient == null)
        {
            return NotFound(new { message = "Patient not found" });
        }

        var reports = await _context.MedicalReports
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.ReportDate)
            .Select(r => new MedicalReportDTO
            {
                Id = r.Id,
                PatientId = r.PatientId,
                PatientName = r.Patient.Name,
                DoctorId = r.DoctorId,
                DoctorName = r.Doctor != null ? r.Doctor.Name : null,
                ReportType = r.ReportType,
                ReportData = r.ReportData,
                Summary = r.Summary,
                ReportDate = r.ReportDate,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        var prescriptions = await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor)
            .Include(p => p.Items)
            .Where(p => p.PatientId == patientId)
            .OrderByDescending(p => p.PrescriptionDate)
            .Select(p => new PrescriptionDTO
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
            })
            .ToListAsync();

        var reminders = await _context.MedicineReminders
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.ReminderDate)
            .ThenByDescending(r => r.ReminderTime)
            .Take(200)
            .Select(r => new MedicineReminderDTO
            {
                Id = r.Id,
                MedicineName = r.MedicineName,
                Dosage = r.Dosage,
                ReminderTime = r.ReminderTime,
                IsCompleted = r.IsCompleted,
                CompletedAt = r.CompletedAt,
                ReminderDate = r.ReminderDate
            })
            .ToListAsync();

        var visits = await _context.QueueEntries
            .Include(q => q.Patient)
            .Include(q => q.Doctor)
            .Where(q => q.PatientId == patientId)
            .OrderByDescending(q => q.ArrivalTime)
            .Take(200)
            .Select(e => new QueueEntryDTO
            {
                Id = e.Id,
                PatientId = e.PatientId,
                PatientName = e.Patient.Name,
                PatientCNIC = e.Patient.CNIC,
                DoctorId = e.DoctorId,
                DoctorName = e.Doctor != null ? e.Doctor.Name : null,
                PriorityScore = e.PriorityScore,
                Status = e.Status,
                ArrivalTime = e.ArrivalTime,
                ConsultationStartTime = e.ConsultationStartTime,
                ConsultationEndTime = e.ConsultationEndTime,
                Symptoms = e.Symptoms,
                CriticalFactors = e.CriticalFactors
            })
            .ToListAsync();

        return Ok(new AdminPatientHistoryDto
        {
            Patient = new AdminPatientDto
            {
                Id = patient.Id,
                Name = patient.Name,
                CNIC = patient.CNIC,
                Email = patient.Email,
                PhoneNumber = patient.PhoneNumber,
                DateOfBirth = patient.DateOfBirth,
                Gender = patient.Gender,
                CreatedAt = patient.CreatedAt
            },
            Reports = reports,
            Prescriptions = prescriptions,
            Reminders = reminders,
            Visits = visits
        });
    }

    // Admin users

    [HttpGet("admins")]
    public async Task<ActionResult<List<AdminUserDto>>> GetAdmins()
    {
        var admins = await _context.Admins
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AdminUserDto
            {
                Id = a.Id,
                Name = a.Name,
                Email = a.Email,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(admins);
    }

    [HttpPost("admins")]
    public async Task<ActionResult> CreateAdmin([FromBody] AdminCreateAdminRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(request.Email)
            || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Name, email, and password are required." });
        }

        var email = request.Email.Trim();
        if (await _context.Admins.AnyAsync(a => a.Email == email))
        {
            return BadRequest(new { message = "Admin with this email already exists." });
        }

        _context.Admins.Add(new Admin
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Admin created successfully" });
    }

    [HttpPost("admins/{adminId:int}/active")]
    public async Task<ActionResult> SetAdminActive(int adminId, [FromBody] AdminSetActiveRequest request)
    {
        var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Id == adminId);
        if (admin == null)
        {
            return NotFound(new { message = "Admin not found" });
        }

        admin.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Admin status updated" });
    }

    [HttpPost("admins/{adminId:int}/reset-password")]
    public async Task<ActionResult> ResetAdminPassword(int adminId, [FromBody] AdminResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Trim().Length < 6)
        {
            return BadRequest(new { message = "NewPassword must be at least 6 characters." });
        }

        var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Id == adminId);
        if (admin == null)
        {
            return NotFound(new { message = "Admin not found" });
        }

        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Admin password reset" });
    }
}
