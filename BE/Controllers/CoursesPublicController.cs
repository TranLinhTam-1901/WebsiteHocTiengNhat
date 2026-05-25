using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Controllers
{
    [ApiController]
    [Route("api/public/courses")]
    public class CoursesPublicController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CoursesPublicController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả khóa học (không cần đăng nhập)
        /// Dùng cho landing page và xem preview khóa học trước khi login
        /// </summary>
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var courses = await _context.Courses
                    .Include(c => c.Level)
                    .Include(c => c.Lessons)
                    .AsNoTracking()
                    .Select(c => new CoursePublicDTO
                    {
                        CourseID = c.CourseID,
                        CourseName = c.CourseName,
                        Description = c.Description,
                        LevelID = c.LevelID,
                        LevelName = c.Level != null ? c.Level.LevelName : "N/A",
                        LessonCount = c.Lessons.Count
                    })
                    .OrderBy(c => c.LevelName)
                    .ThenBy(c => c.CourseName)
                    .ToListAsync();

                return Ok(new { success = true, data = courses });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy danh sách khóa học theo level cụ thể (không cần đăng nhập)
        /// </summary>
        [HttpGet("level/{levelId}")]
        public async Task<IActionResult> GetByLevel([FromRoute] Guid levelId)
        {
            try
            {
                var level = await _context.JLPT_Levels
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.LevelID == levelId);

                if (level == null)
                    return NotFound(new { success = false, message = "Level không tồn tại." });

                var courses = await _context.Courses
                    .Include(c => c.Lessons)
                    .AsNoTracking()
                    .Where(c => c.LevelID == levelId)
                    .Select(c => new CoursePublicDTO
                    {
                        CourseID = c.CourseID,
                        CourseName = c.CourseName,
                        Description = c.Description,
                        LevelID = c.LevelID,
                        LevelName = level.LevelName,
                        LessonCount = c.Lessons.Count
                    })
                    .OrderBy(c => c.CourseName)
                    .ToListAsync();

                return Ok(new { success = true, data = courses });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy chi tiết một khóa học (không cần đăng nhập)
        /// </summary>
        [HttpGet("{courseId}")]
        public async Task<IActionResult> GetById([FromRoute] Guid courseId)
        {
            try
            {
                var course = await _context.Courses
                    .Include(c => c.Level)
                    .Include(c => c.Lessons)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CourseID == courseId);

                if (course == null)
                    return NotFound(new { success = false, message = "Khóa học không tồn tại." });

                var courseDetail = new
                {
                    courseID = course.CourseID,
                    courseName = course.CourseName,
                    description = course.Description,
                    levelID = course.LevelID,
                    levelName = course.Level != null ? course.Level.LevelName : "N/A",
                    lessonCount = course.Lessons.Count,
                    lessons = course.Lessons
                        .OrderBy(l => l.SortOrder)
                        .Select(l => new
                        {
                            lessonID = l.LessonID,
                            title = l.Title,
                            sortOrder = l.SortOrder
                        })
                        .ToList()
                };

                return Ok(new { success = true, data = courseDetail });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }
    }
}
