using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/profile")]
    [Authorize(Roles = "Learner")]
    public class LearnerProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public LearnerProfileController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // 1. Lấy thông tin User kèm theo Level
            var user = await _userManager.Users
                .Include(u => u.Level)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            // 2. Lấy danh sách Role
            var roles = await _userManager.GetRolesAsync(user);

            // 3. Tính toán progress theo đúng level của user (không hardcode)
            if (user.LevelID == null)
            {
                return BadRequest(new { message = "User level not found." });
            }

            var levelId = user.LevelID.Value;
            var completedLessons = await _context.Progresses
                .Where(p => p.UserID == user.Id
                            && p.LevelID == levelId
                            && p.Status == "Completed")
                .Select(p => p.LessonsID)
                .Distinct()
                .CountAsync();

            var totalLessons = await _context.Lessons
                .Where(l => l.Course.LevelID == levelId)
                .CountAsync();

            int percent = totalLessons > 0
                ? (int)((double)completedLessons / totalLessons * 100)
                : 0;

            // Giới hạn không quá 100%
            if (percent > 100) percent = 100;

            // 4. Trả về kết quả (Sử dụng camelCase cho đồng bộ với JSON chuẩn)
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = roles.FirstOrDefault() ?? "No Role",
                isLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow,
                levelId = user.LevelID,
                levelName = user.Level?.LevelName ?? "N5",
                progressPercent = percent,
                completedLessons = completedLessons,
                totalLessons = totalLessons
            });
        }
    }
}
