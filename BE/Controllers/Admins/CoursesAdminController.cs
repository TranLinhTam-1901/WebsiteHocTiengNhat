using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Admin.Course;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/courses")]
    [Authorize(Roles = "Admin")]
    public class CoursesAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CoursesAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả khóa học
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var courses = await _context.Courses
                    .Include(c => c.Level)
                    .Include(c => c.Lessons)
                    .Select(c => new
                    {
                        courseID = c.CourseID,
                        courseName = c.CourseName,
                        description = c.Description,
                        levelID = c.LevelID,
                        levelName = c.Level != null ? c.Level.LevelName : "N/A",
                        lessonCount = c.Lessons.Count
                    })
                    .OrderBy(c => c.courseName)
                    .ToListAsync();

                return Ok(new { success = true, data = courses });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 2. Lấy chi tiết một khóa học
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var course = await _context.Courses
                    .Include(c => c.Level)
                    .Include(c => c.Lessons)
                    .FirstOrDefaultAsync(c => c.CourseID == id);

                if (course == null)
                    return NotFound(new { success = false, message = "Không tìm thấy khóa học." });

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        courseID = course.CourseID,
                        courseName = course.CourseName,
                        description = course.Description,
                        levelID = course.LevelID,
                        levelName = course.Level != null ? course.Level.LevelName : "N/A",
                        lessons = course.Lessons.Select(l => new
                        {
                            lessonID = l.LessonID,
                            title = l.Title,
                            priority = l.SortOrder
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 3. Thêm mới khóa học
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateCourseDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CourseName))
                    return BadRequest(new { success = false, message = "Tên khóa học không được để trống." });

                // Kiểm tra Level có tồn tại không
                var level = await _context.JLPT_Levels.FindAsync(dto.LevelID);
                if (level == null)
                    return BadRequest(new { success = false, message = "Cấp độ JLPT không tồn tại." });

                var course = new Courses
                {
                    CourseID = Guid.NewGuid(),
                    CourseName = dto.CourseName,
                    Description = dto.Description,
                    LevelID = dto.LevelID
                };

                _context.Courses.Add(course);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = course.CourseID },
                    new { success = true, message = "Thêm khóa học thành công", courseID = course.CourseID });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 4. Cập nhật khóa học
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateCourseDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CourseName))
                    return BadRequest(new { success = false, message = "Tên khóa học không được để trống." });

                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                    return NotFound(new { success = false, message = "Không tìm thấy khóa học." });

                // Kiểm tra Level có tồn tại không
                var level = await _context.JLPT_Levels.FindAsync(dto.LevelID);
                if (level == null)
                    return BadRequest(new { success = false, message = "Cấp độ JLPT không tồn tại." });

                course.CourseName = dto.CourseName;
                course.Description = dto.Description;
                course.LevelID = dto.LevelID;

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Cập nhật khóa học thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 5. Xóa khóa học
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var course = await _context.Courses
                    .Include(c => c.Lessons)
                    .FirstOrDefaultAsync(c => c.CourseID == id);

                if (course == null)
                    return NotFound(new { success = false, message = "Không tìm thấy khóa học." });

                // Xóa tất cả các bài học liên kết
                _context.Lessons.RemoveRange(course.Lessons);
                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa khóa học thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 6. Metadata: Trả về danh sách khóa học cho dropdown
        [HttpGet("metadata")]
        public async Task<IActionResult> GetMetadata()
        {
            try
            {
                var metadata = await _context.Courses
                    .Select(c => new { courseID = c.CourseID, courseName = c.CourseName })
                    .OrderBy(c => c.courseName)
                    .ToListAsync();

                return Ok(new { success = true, data = metadata });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevelsMetadata()
        {
            var levels = await _context.JLPT_Levels
                .Select(l => new
                {
                    id = l.LevelID,
                    name = l.LevelName
                })
                .OrderBy(l => l.name)
                .ToListAsync();

            return Ok(new { success = true, data = levels });
        }

    }
}
