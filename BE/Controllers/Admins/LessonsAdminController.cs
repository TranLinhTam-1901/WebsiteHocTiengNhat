using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Admin.Lesson;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/lessons")]
    [Authorize(Roles = "Admin")]
    public class LessonsAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LessonsAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả bài học
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var lessons = await _context.Lessons
                    .Include(l => l.Course)
                    .Include(l => l.Questions)
                    .Select(l => new
                    {
                        lessonID = l.LessonID,
                        courseID = l.CourseID,
                        courseName = l.Course != null ? l.Course.CourseName : "N/A",
                        title = l.Title,
                        skillType = l.SkillType,
                        difficulty = l.Difficulty,
                        priority = l.SortOrder,
                        questionCount = l.Questions.Count
                    })
                    .OrderBy(l => l.priority)
                    .ToListAsync();

                return Ok(new { success = true, data = lessons });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 2. Lấy danh sách bài học theo khóa học
        [HttpGet("get-by-course/{courseId}")]
        public async Task<IActionResult> GetByCourse(Guid courseId)
        {
            try
            {
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                    return NotFound(new { success = false, message = "Không tìm thấy khóa học." });

                var lessons = await _context.Lessons
                    .Where(l => l.CourseID == courseId)
                    .Include(l => l.Questions)
                    .Select(l => new
                    {
                        lessonID = l.LessonID,
                        title = l.Title,
                        skillType = l.SkillType,
                        difficulty = l.Difficulty,
                        priority = l.SortOrder,
                        questionCount = l.Questions.Count
                    })
                    .OrderBy(l => l.priority)
                    .ToListAsync();

                return Ok(new { success = true, data = lessons });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 3. Lấy chi tiết một bài học
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var lesson = await _context.Lessons
                    .Include(l => l.Course)
                    .Include(l => l.Questions)
                    .Include(l => l.LessonTopics).ThenInclude(lt => lt.Topic)
                    .FirstOrDefaultAsync(l => l.LessonID == id);

                if (lesson == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bài học." });

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        lessonID = lesson.LessonID,
                        courseID = lesson.CourseID,
                        courseName = lesson.Course != null ? lesson.Course.CourseName : "N/A",
                        title = lesson.Title,
                        skillType = lesson.SkillType,
                        difficulty = lesson.Difficulty,
                        priority = lesson.SortOrder,
                        topics = lesson.LessonTopics.Select(lt => new
                        {
                            topicID = lt.TopicID,
                            topicName = lt.Topic.TopicName
                        }).ToList(),
                        questions = lesson.Questions.Select(q => new
                        {
                            questionID = q.QuestionID,
                            content = q.Content
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 4. Thêm mới bài học
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateLessonDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Title))
                    return BadRequest(new { success = false, message = "Tiêu đề bài học không được để trống." });

                // Kiểm tra khóa học có tồn tại không
                var course = await _context.Courses.FindAsync(dto.CourseID);
                if (course == null)
                    return BadRequest(new { success = false, message = "Khóa học không tồn tại." });

                var lesson = new Lessons
                {
                    LessonID = Guid.NewGuid(),
                    CourseID = dto.CourseID,
                    Title = dto.Title,
                    SkillType = dto.SkillType,
                    Difficulty = dto.Difficulty,
                    SortOrder = dto.Priority
                };

                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = lesson.LessonID },
                    new { success = true, message = "Thêm bài học thành công", lessonID = lesson.LessonID });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 5. Cập nhật bài học
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateLessonDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Title))
                    return BadRequest(new { success = false, message = "Tiêu đề bài học không được để trống." });

                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bài học." });

                // Kiểm tra khóa học có tồn tại không (nếu thay đổi)
                if (lesson.CourseID != dto.CourseID)
                {
                    var course = await _context.Courses.FindAsync(dto.CourseID);
                    if (course == null)
                        return BadRequest(new { success = false, message = "Khóa học không tồn tại." });
                }

                lesson.CourseID = dto.CourseID;
                lesson.Title = dto.Title;
                lesson.SkillType = dto.SkillType;
                lesson.Difficulty = dto.Difficulty;
                lesson.SortOrder = dto.Priority;

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Cập nhật bài học thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 6. Xóa bài học
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var lesson = await _context.Lessons
                    .Include(l => l.Progresses)
                    .Include(l => l.LessonTopics)
                    .FirstOrDefaultAsync(l => l.LessonID == id);

                if (lesson == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bài học." });

                // Xóa tiến trình học tập liên kết
                if (lesson.Progresses.Any())
                    _context.Progresses.RemoveRange(lesson.Progresses);

                // Xóa các chủ đề liên kết
                if (lesson.LessonTopics.Any())
                    _context.Lessons_Topics.RemoveRange(lesson.LessonTopics);

                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa bài học thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 7. Metadata: Trả về danh sách bài học cho dropdown
        [HttpGet("metadata")]
        public async Task<IActionResult> GetMetadata()
        {
            try
            {
                var metadata = await _context.Lessons
                    .Select(l => new { lessonID = l.LessonID, title = l.Title })
                    .OrderBy(l => l.title)
                    .ToListAsync();

                return Ok(new { success = true, data = metadata });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // 8. Metadata: Trả về danh sách loại kỹ năng (SkillType)
        [HttpGet("skill-types")]
        public IActionResult GetSkillTypes()
        {
            try
            {
                var skillTypes = Enum.GetValues(typeof(QuizzTiengNhat.Models.Enums.SkillType))
                    .Cast<QuizzTiengNhat.Models.Enums.SkillType>()
                    .Select(st => new { value = (int)st, name = st.ToString() })
                    .ToList();

                return Ok(new { success = true, data = skillTypes });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }
    }
}
