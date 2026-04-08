using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/lessons")]
    [Authorize(Roles = "Learner")]
    public class LearnerLessonProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private const string PROGRESS_COMPLETED = "Completed";

        public LearnerLessonProgressController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string RequireUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("Missing userId in token.");
            return userId;
        }

        // Learner marks a lesson as completed (idempotent upsert)
        // Response includes completion state so FE can update UI immediately.
        [HttpPost("{lessonId}/complete")]
        public async Task<IActionResult> CompleteLesson([FromRoute] Guid lessonId)
        {
            try
            {
                var userId = RequireUserId();

                var user = await _context.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null) return Unauthorized();
                if (user.LevelID == null) return BadRequest(new { message = "User level not found." });

                var lessonExists = await _context.Lessons.AsNoTracking()
                    .AnyAsync(l => l.LessonID == lessonId);
                if (!lessonExists) return NotFound(new { message = "Lesson not found." });

                var now = DateTime.UtcNow;

                var existing = await _context.Progresses
                    .FirstOrDefaultAsync(p => p.UserID == userId && p.LessonsID == lessonId);

                if (existing == null)
                {
                    existing = new Progress
                    {
                        ProgressID = Guid.NewGuid(),
                        UserID = userId,
                        LevelID = user.LevelID.Value,
                        LessonsID = lessonId,
                        Status = PROGRESS_COMPLETED,
                        LastAccessed = now,
                        CompletedAt = now
                    };

                    _context.Progresses.Add(existing);
                }
                else
                {
                    existing.LevelID = user.LevelID.Value;
                    existing.Status = PROGRESS_COMPLETED;
                    existing.LastAccessed = now;
                    if (existing.CompletedAt == default)
                    {
                        existing.CompletedAt = now;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    lessonId,
                    isCompleted = true,
                    status = PROGRESS_COMPLETED,
                    completedAt = existing.CompletedAt
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }
    }
}

