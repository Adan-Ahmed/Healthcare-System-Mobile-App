using HealthcareSystem.API.DTOs;
using HealthcareSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HealthcareSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Patient")]
public class ReminderController : ControllerBase
{
    private readonly IReminderService _reminderService;

    public ReminderController(IReminderService reminderService)
    {
        _reminderService = reminderService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MedicineReminderDTO>>> GetReminders()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var reminders = await _reminderService.GetPatientRemindersAsync(userId);
        return Ok(reminders);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MedicineReminderDTO>> UpdateReminder(int id, [FromBody] UpdateReminderRequest request)
    {
        var reminder = await _reminderService.UpdateReminderStatusAsync(id, request);
        if (reminder == null)
        {
            return NotFound();
        }
        return Ok(reminder);
    }
}
