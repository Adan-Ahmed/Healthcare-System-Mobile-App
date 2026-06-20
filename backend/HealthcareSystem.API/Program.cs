using HealthcareSystem.API.Data;
using HealthcareSystem.API.Middleware;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=FAHADMUJTABA\\SQLEXPRESS;Database=HealthcareSystemDB;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<HealthcareDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        );

        sqlOptions.CommandTimeout(60);
    }));
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste only the token here (no 'Bearer ' prefix)."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactNative", policy =>
    {
        // Dev-friendly CORS (React Native + Admin Portal).
        // If deploying to production, restrict origins to your actual domains.
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyForJWTTokenGeneration123456789";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "HealthcareSystem";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IQueueService, QueueService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<IReminderService, ReminderService>();
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddTransient<HttpAuditMiddleware>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactNative");
app.UseMiddleware<HttpAuditMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Initialize Database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<HealthcareDbContext>();
    dbContext.Database.EnsureCreated();
    dbContext.Database.ExecuteSqlRaw("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Patients' AND COLUMN_NAME = 'EmailVerified')
        BEGIN
            ALTER TABLE Patients ADD EmailVerified bit NOT NULL CONSTRAINT DF_Patients_EmailVerified DEFAULT 1;
            ALTER TABLE Patients ADD EmailVerificationCodeHash nvarchar(max) NULL;
            ALTER TABLE Patients ADD EmailVerificationExpiryUtc datetime2 NULL;
        END
        """);

    // Create Admins table for admin web portal (works even if DB already existed before Admin model was added)
    dbContext.Database.ExecuteSqlRaw("""
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Admins')
        BEGIN
            CREATE TABLE Admins (
                Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                Name nvarchar(100) NOT NULL,
                Email nvarchar(100) NOT NULL,
                PasswordHash nvarchar(max) NOT NULL,
                IsActive bit NOT NULL CONSTRAINT DF_Admins_IsActive DEFAULT 1,
                CreatedAt datetime2 NOT NULL CONSTRAINT DF_Admins_CreatedAt DEFAULT (SYSUTCDATETIME())
            );
            CREATE UNIQUE INDEX IX_Admins_Email ON Admins(Email);
        END
        """);

    // Receptionists need IsActive for portal-managed enable/disable.
    dbContext.Database.ExecuteSqlRaw("""
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Receptionists' AND COLUMN_NAME = 'IsActive')
        BEGIN
            ALTER TABLE Receptionists ADD IsActive bit NOT NULL CONSTRAINT DF_Receptionists_IsActive DEFAULT 1;
        END
        """);

    // Request/response audit logs
    dbContext.Database.ExecuteSqlRaw("""
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'HttpAuditLogs')
        BEGIN
          CREATE TABLE HttpAuditLogs (
            Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
            CreatedAtUtc datetimeoffset NOT NULL,
            TransactionId nvarchar(64) NOT NULL,
            Method nvarchar(16) NOT NULL,
            Path nvarchar(512) NOT NULL,
            QueryString nvarchar(2048) NULL,
            StatusCode int NOT NULL,
            DurationMs bigint NOT NULL,
            RemoteIp nvarchar(64) NULL,
            UserId nvarchar(128) NULL,
            UserAgent nvarchar(512) NULL,
            RequestBody nvarchar(max) NULL,
            ResponseBody nvarchar(max) NULL
          );
        END
        ELSE IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'HttpAuditLogs' AND COLUMN_NAME = 'TransactionId')
        BEGIN
          ALTER TABLE HttpAuditLogs ADD TransactionId nvarchar(64) NOT NULL CONSTRAINT DF_HttpAuditLogs_TransactionId DEFAULT ('');
        END
        """);

    // Seed an initial admin if requested via configuration.
    // Set environment variables (recommended) or appsettings:
    //   Admin:SeedEmail, Admin:SeedPassword, Admin:SeedName
    var seedEmail = builder.Configuration["Admin:SeedEmail"];
    var seedPassword = builder.Configuration["Admin:SeedPassword"];
    var seedName = builder.Configuration["Admin:SeedName"] ?? "System Admin";
    if (!string.IsNullOrWhiteSpace(seedEmail) && !string.IsNullOrWhiteSpace(seedPassword))
    {
        seedEmail = seedEmail.Trim();
        if (!dbContext.Admins.Any(a => a.Email == seedEmail))
        {
            dbContext.Admins.Add(new HealthcareSystem.API.Models.Admin
            {
                Name = seedName.Trim(),
                Email = seedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            });
            dbContext.SaveChanges();
        }
    }
    else if (app.Environment.IsDevelopment() && !dbContext.Admins.Any())
    {
        // Dev-only fallback: create a default admin so the portal can be used immediately.
        // Change this after first login.
        dbContext.Admins.Add(new HealthcareSystem.API.Models.Admin
        {
            Name = "Default Admin",
            Email = "admin@clinic.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        });
        dbContext.SaveChanges();
    }
}

app.Run();
