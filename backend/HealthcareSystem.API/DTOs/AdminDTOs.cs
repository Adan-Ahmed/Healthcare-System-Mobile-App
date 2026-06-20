namespace HealthcareSystem.API.DTOs;

public class AdminDoctorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? LicenseNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminReceptionistDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminUpdateDoctorRequest
{
    public string? Name { get; set; }
    public string? Specialization { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? LicenseNumber { get; set; }
}

public class AdminUpdateReceptionistRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
}

public class AdminResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}

public class AdminSetActiveRequest
{
    public bool IsActive { get; set; }
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminCreateAdminRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminPatientDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CNIC { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminPatientHistoryDto
{
    public AdminPatientDto Patient { get; set; } = new();
    public List<MedicalReportDTO> Reports { get; set; } = new();
    public List<PrescriptionDTO> Prescriptions { get; set; } = new();
    public List<MedicineReminderDTO> Reminders { get; set; } = new();
    public List<QueueEntryDTO> Visits { get; set; } = new();
}

