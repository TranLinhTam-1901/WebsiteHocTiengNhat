using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Data;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/reading")]
    [Authorize(Roles = "Admin")]
    public class ReadingAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReadingAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetReadings()
        {
            var readings = await _context.Readings
                .Include(r => r.JLPTLevel)
                .Include(r => r.Topic)
                .OrderByDescending(r => r.UpdatedAt)
                .Select(r => new ReadingDTO
                {
                    Id = r.ReadingID,
                    Title = r.Title,
                    LevelName = r.JLPTLevel != null ? r.JLPTLevel.LevelName : "N/A",
                    TopicName = r.Topic != null ? r.Topic.TopicName : "N/A",
                    WordCount = r.WordCount,
                    EstimatedTime = r.EstimatedTime,
                    Status = r.Status,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return Ok(readings);
        }

        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var r = await _context.Readings
                .Include(r => r.Questions)
                    .ThenInclude(q => q.Answers)
                .FirstOrDefaultAsync(r => r.ReadingID == id);

            if (r == null) return NotFound("Không tìm thấy bài đọc.");

            return Ok(new
            {
                title = r.Title,
                content = r.Content,
                translation = r.Translation,
                wordCount = r.WordCount,
                estimatedTime = r.EstimatedTime,
                status = r.Status,
                levelID = r.LevelID,
                topicID = r.TopicID,
                lessonID = r.LessonID,
                questions = r.Questions.Select(q => new
                {
                    questionID = q.QuestionID, // Thêm ID để dễ quản lý ở Front-end
                    content = q.Content,
                    explanation = q.Explanation,
                    difficulty = q.Difficulty,
                    questionType = q.QuestionType,
                    status = q.Status,
                    answers = q.Answers.Select(a => new
                    {
                        answerID = a.AnswerID,
                        answerText = a.AnswerText,
                        isCorrect = a.IsCorrect
                    })
                })
            });
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateReadingDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var reading = new Readings
                {
                    ReadingID = Guid.NewGuid(),
                    Title = dto.Title,
                    Content = dto.Content,
                    Translation = dto.Translation,
                    WordCount = dto.WordCount > 0 ? dto.WordCount : dto.Content.Length,
                    EstimatedTime = dto.EstimatedTime,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    TopicID = dto.TopicID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Readings.Add(reading);

                if (dto.Questions != null)
                {
                    foreach (var qDto in dto.Questions)
                    {
                        var question = new Questions
                        {
                            QuestionID = Guid.NewGuid(),
                            ReadingID = reading.ReadingID,
                            LessonID = dto.LessonID, // Đảm bảo Question thuộc cùng Lesson với Reading
                            Content = qDto.Content,
                            Explanation = qDto.Explanation,
                            Difficulty = qDto.Difficulty,
                            QuestionType = QuestionType.MultipleChoice, // Hoặc lấy từ DTO nếu có
                            Status = QuestionStatus.Active
                        };

                        foreach (var aDto in qDto.Answers)
                        {
                            question.Answers.Add(new Answers
                            {
                                AnswerID = Guid.NewGuid(),
                                AnswerText = aDto.AnswerText,
                                IsCorrect = aDto.IsCorrect
                            });
                        }
                        _context.Questions.Add(question);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Thêm bài đọc và câu hỏi thành công", id = reading.ReadingID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi hệ thống: {ex.Message}");
            }
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateReadingDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var reading = await _context.Readings
                    .Include(r => r.Questions)
                        .ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(r => r.ReadingID == id);

                if (reading == null) return NotFound("Không tìm thấy bài đọc để cập nhật.");

                // 1. Cập nhật thông tin chính bài đọc
                reading.Title = dto.Title;
                reading.Content = dto.Content;
                reading.Translation = dto.Translation;
                reading.WordCount = dto.WordCount > 0 ? dto.WordCount : dto.Content.Length;
                reading.EstimatedTime = dto.EstimatedTime;
                reading.Status = dto.Status;
                reading.LevelID = dto.LevelID;
                reading.TopicID = dto.TopicID;
                reading.LessonID = dto.LessonID;
                reading.UpdatedAt = DateTime.UtcNow;

                // 2. Xử lý Questions: Xóa triệt để các câu hỏi cũ thuộc bài đọc này
                // (EF Core sẽ tự động xóa Answers nếu đã cấu hình Cascade Delete)
                if (reading.Questions != null && reading.Questions.Any())
                {
                    _context.Questions.RemoveRange(reading.Questions);
                }

                // 3. Thêm lại danh sách Questions mới từ DTO
                if (dto.Questions != null)
                {
                    foreach (var qDto in dto.Questions)
                    {
                        var nQ = new Questions
                        {
                            QuestionID = Guid.NewGuid(),
                            ReadingID = id,
                            LessonID = dto.LessonID, // Luôn đồng bộ LessonID với bài đọc
                            Content = qDto.Content,
                            Explanation = qDto.Explanation,
                            Difficulty = qDto.Difficulty,
                            QuestionType = QuestionType.MultipleChoice,
                            Status = QuestionStatus.Active,
                            Answers = qDto.Answers.Select(aDto => new Answers
                            {
                                AnswerID = Guid.NewGuid(),
                                AnswerText = aDto.AnswerText,
                                IsCorrect = aDto.IsCorrect
                            }).ToList()
                        };
                        _context.Questions.Add(nQ);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Cập nhật bài đọc và danh sách câu hỏi thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi cập nhật: {ex.Message}");
            }
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            // Tìm bài đọc kèm theo câu hỏi để đảm bảo xóa sạch (nếu DB không tự cascade)
            var reading = await _context.Readings
                .Include(r => r.Questions)
                .FirstOrDefaultAsync(r => r.ReadingID == id);

            if (reading == null) return NotFound();

            _context.Readings.Remove(reading);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bài đọc và các dữ liệu liên quan" });
        }

        // --- Metadata: Thống nhất format trả về ---
        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() =>
            Ok(await _context.JLPT_Levels.Select(l => new { levelID = l.LevelID, levelName = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() =>
            Ok(await _context.Topics.Select(t => new { topicID = t.TopicID, topicName = t.TopicName }).ToListAsync());

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons() =>
            Ok(await _context.Lessons.Select(l => new { lessonID = l.LessonID, title = l.Title }).ToListAsync());
    }
}