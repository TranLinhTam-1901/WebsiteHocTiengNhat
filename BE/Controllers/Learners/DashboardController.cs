using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using QuizzTiengNhat.DTOs.Learner.Progress;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Controllers.Learner
{
    [ApiController]
    [Route("api/learner/dashboard")]
    [Authorize] 
    public class DashboardController : ControllerBase
    {
        private readonly IProgressService _progressService;
        private readonly ApplicationDbContext _context;

        private static readonly SkillType[] DashboardSkills =
        {
            SkillType.Vocabulary,
            SkillType.Grammar,
            SkillType.Kanji,
            SkillType.Reading,
            SkillType.Listening
        };

        public DashboardController(IProgressService progressService, ApplicationDbContext context)
        {
            _progressService = progressService;
            _context = context;
        }

        [HttpGet("progress")]
        public async Task<IActionResult> GetProgress()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng." });

            var result = await _progressService.CalculateGlobalProgressAsync(userId);
            return Ok(result);
        }

        [HttpGet("skill-matrix")]
        public async Task<IActionResult> GetSkillMatrix()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng." });

            var matrixRows = await _context.User_Skill_Matrices
                .AsNoTracking()
                .Where(m => m.UserID == userId && DashboardSkills.Contains(m.SkillType))
                .Include(m => m.Level)
                .ToListAsync();

            var matrixBySkill = matrixRows
                .GroupBy(m => m.SkillType)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(x => x.ProficiencyScore).First());

            var skills = DashboardSkills.Select(skillType =>
            {
                matrixBySkill.TryGetValue(skillType, out var row);
                return new UserSkillMatrixItemDTO
                {
                    SkillType = skillType,
                    SkillName = Enum.GetName(typeof(SkillType), skillType) ?? skillType.ToString(),
                    ProficiencyScore = row?.ProficiencyScore ?? 0,
                    Confidence = row?.Confidence ?? 0,
                    NeedsReview = row?.NeedsReview ?? false,
                    LevelName = row?.Level?.LevelName,
                    LastUpdated = row?.LastUpdated
                };
            }).ToList();

            var response = new UserSkillMatrixResponseDTO
            {
                Skills = skills,
                AverageProficiency = skills.Count > 0
                    ? Math.Round(skills.Average(s => s.ProficiencyScore), 1)
                    : 0,
                SkillsNeedingReview = skills.Count(s => s.NeedsReview)
            };

            return Ok(response);
        }
    }
}