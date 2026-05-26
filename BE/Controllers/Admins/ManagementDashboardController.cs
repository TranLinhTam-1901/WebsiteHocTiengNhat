using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Controllers.Admins;

[ApiController]
[Route("api/admin/management")]
[Authorize(Roles = "Admin")]
public class ManagementDashboardController : ControllerBase
{
    private readonly IProgressService _progressService;
    private readonly UserManager<ApplicationUser> _userManager;

    public ManagementDashboardController(
        IProgressService progressService,
        UserManager<ApplicationUser> userManager)
    {
        _progressService = progressService;
        _userManager = userManager;
    }

    [HttpGet("learner-progress/{learnerId}")]
    public async Task<IActionResult> GetLearnerProgress(string learnerId)
    {
        var result = await _progressService.CalculateGlobalProgressAsync(learnerId);
        if (result == null)
            return NotFound("Không tìm thấy học viên.");

        return Ok(result);
    }

    /// <summary>
    /// Trung bình cộng TotalPercent của mọi học viên (cùng công thức modal chi tiết).
    /// </summary>
    [HttpGet("learners-progress-summary")]
    public async Task<IActionResult> GetLearnersProgressSummary(CancellationToken cancellationToken)
    {
        var learners = await _userManager.GetUsersInRoleAsync(SD.Role_Learner);
        var total = learners.Count;

        if (total == 0)
        {
            return Ok(new LearnersProgressSummaryDTO
            {
                AverageProgressPercent = 0,
                TotalLearners = 0,
                IncludedInAverage = 0,
                LearnersWithoutLevel = 0,
            });
        }

        var withoutLevel = learners.Count(l => l.LevelID == null);

        var percentTasks = learners.Select(async learner =>
        {
            var dto = await _progressService.CalculateGlobalProgressAsync(learner.Id);
            return dto.TotalPercent;
        });

        var percents = await Task.WhenAll(percentTasks);

        var average = Math.Round(percents.Average(), 1);

        return Ok(new LearnersProgressSummaryDTO
        {
            AverageProgressPercent = average,
            TotalLearners = total,
            IncludedInAverage = percents.Length,
            LearnersWithoutLevel = withoutLevel,
        });
    }
}
