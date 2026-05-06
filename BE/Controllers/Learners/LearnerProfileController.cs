using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner;
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
                totalLessons = totalLessons,
                avatarUrl = user.AvatarUrl
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] LearnerProfileUpdateRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                user.FullName = request.FullName;
            }

            if (request.AvatarUrl != null)
            {
                user.AvatarUrl = request.AvatarUrl;
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            var roles = await _userManager.GetRolesAsync(user);
            var completedLessons = await _context.Progresses
                .CountAsync(p => p.UserID == user.Id && p.Status == "Completed");

            int totalLessons = 0;
            if (user.LevelID.HasValue)
            {
                totalLessons = await _context.Lessons
                    .Include(l => l.Course)
                    .CountAsync(l => l.Course.LevelID == user.LevelID.Value);
            }

            if (totalLessons == 0)
            {
                totalLessons = await _context.Lessons.CountAsync();
            }

            if (totalLessons == 0)
            {
                totalLessons = 50;
            }

            int percent = totalLessons > 0 ? (int)((double)completedLessons / totalLessons * 100) : 0;
            if (percent > 100) percent = 100;

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
                avatarUrl = user.AvatarUrl
            });
        }
    }
}
