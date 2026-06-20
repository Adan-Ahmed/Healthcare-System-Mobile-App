# Healthcare System Backend

## Overview
This is a .NET 8.0 Web API backend for a comprehensive healthcare management system.

## Features
- Patient registration and authentication via CNIC
- Doctor authentication
- AI-based critical-first queue system
- Medical report management with AI summarization
- Prescription management
- Medicine reminders with checklist
- Sensor data collection
- Symptoms tracking

## Prerequisites
- .NET 8.0 SDK
- SQL Server (Server: FAHADMUJTABA\SQLEXPRESS)
- Visual Studio 2022 or VS Code

## Setup Instructions

1. **Restore NuGet packages:**
   ```bash
   dotnet restore
   ```

2. **Update connection string** in `appsettings.json` if needed:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=FAHADMUJTABA\\SQLEXPRESS;Database=HealthcareSystemDB;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```

3. **Run database migrations:**
   ```bash
   cd HealthcareSystem.API
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```
   
   Or if EF Tools are not installed:
   ```bash
   dotnet tool install --global dotnet-ef
   ```

4. **Run the application:**
   ```bash
   dotnet run
   ```

5. **Access Swagger UI:**
   Navigate to `https://localhost:5001/swagger` (or the port shown in console)

## API Endpoints

### Authentication
- `POST /api/auth/patient/register` - Register new patient
- `POST /api/auth/patient/login` - Patient login
- `POST /api/auth/doctor/login` - Doctor login

### Patient
- `GET /api/patient/profile` - Get patient profile
- `POST /api/patient/symptoms` - Add symptoms
- `POST /api/patient/sensor-data` - Add sensor data

### Queue
- `POST /api/queue/join` - Join queue
- `GET /api/queue` - Get queue entries

### Doctor
- `GET /api/doctor/queue` - Get doctor's queue
- `POST /api/doctor/queue/{id}/start` - Start consultation
- `POST /api/doctor/queue/{id}/complete` - Complete consultation

### Reports
- `GET /api/report/patient/{patientId}` - Get patient reports
- `POST /api/report` - Create report (Doctor only)
- `POST /api/report/{id}/summary` - Generate AI summary

### Prescriptions
- `POST /api/prescription` - Create prescription (Doctor only)
- `GET /api/prescription/patient/{patientId}` - Get patient prescriptions

### Reminders
- `GET /api/reminder` - Get patient reminders
- `PUT /api/reminder/{id}` - Update reminder status

## Database Models
- Patient
- Doctor
- Appointment
- QueueEntry
- MedicalReport
- Prescription
- PrescriptionItem
- MedicineReminder
- Symptom
- SensorData

## AI Integration
The AI service includes placeholder implementations for:
- Priority score calculation
- Critical factor identification
- Report summarization

Replace `AIService.cs` with actual AI/ML service integration (OpenAI, Azure AI, etc.) for production use.

## Security
- JWT-based authentication
- Password hashing using BCrypt
- Role-based authorization (Patient/Doctor)
