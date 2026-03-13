using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Helpers; // Để dùng FileHelper
using QuizzTiengNhat.Data;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/listening")]
    [Authorize(Roles = "Admin")]
    public class ListeningAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ListeningAdminController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // 1. Lấy danh sách bài nghe
        [HttpGet("get-all")]
        public async Task<IActionResult> GetListenings()
        {
            var listenings = await _context.Listenings
                .Include(l => l.JLPTLevel)
                .Include(l => l.Topic)
                .OrderByDescending(l => l.UpdatedAt)
                .Select(l => new
                {
                    Id = l.ListeningID,
                    Title = l.Title,
                    AudioURL = l.AudioURL,
                    LevelName = l.JLPTLevel != null ? l.JLPTLevel.LevelName : "N/A",
                    TopicName = l.Topic != null ? l.Topic.TopicName : "N/A",
                    Duration = l.Duration,
                    Status = l.Status,
                    UpdatedAt = l.UpdatedAt
                })
                .ToListAsync();

            return Ok(listenings);
        }

        // 2. Lấy chi tiết bài nghe
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var l = await _context.Listenings
                .Include(l => l.Questions)
                    .ThenInclude(q => q.Answers)
                .FirstOrDefaultAsync(l => l.ListeningID == id);

            if (l == null) return NotFound("Không tìm thấy bài nghe.");

            return Ok(new
            {
                listeningID = l.ListeningID,
                title = l.Title,
                audioURL = l.AudioURL, // Trả về đường dẫn file
                script = l.Script,
                transcript = l.Transcript,
                duration = l.Duration,
                speedCategory = l.SpeedCategory,
                status = l.Status,
                levelID = l.LevelID,
                topicID = l.TopicID,
                lessonID = l.LessonID,
                questions = l.Questions.OrderBy(q => q.DisplayOrder).Select(q => new
                {
                    questionID = q.QuestionID,
                    content = q.Content,
                    imageURL = q.ImageURL, // Trả về đường dẫn file ảnh
                    mediaTimestamp = q.MediaTimestamp,
                    explanation = q.Explanation,
                    difficulty = q.Difficulty,
                    questionType = q.QuestionType,
                    displayOrder = q.DisplayOrder,
                    status = q.Status,
                    answers = q.Answers.Select(a => new
                    {
                        answerID = a.AnswerID,
                        answerText = a.AnswerText,
                        isCorrect = a.IsCorrect,
                    })
                })
            });
        }

        // 3. Thêm mới bài nghe (Chuyển Base64 thành File vật lý)
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateListeningDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Xử lý lưu file Audio (Base64 -> File)
                string audioPath = null;
                if (!string.IsNullOrEmpty(dto.AudioURL))
                {
                    // Giống Kanji: SaveBase64Image(chuỗi, thư mục, tên file, root)
                    audioPath = await FileHelper.SaveBase64Image(dto.AudioURL, "listening-audios", $"audio_{Guid.NewGuid()}", _env.WebRootPath);
                }

                var listening = new Listenings
                {
                    ListeningID = Guid.NewGuid(),
                    Title = dto.Title,
                    AudioURL = audioPath, // Lưu path vật lý vào DB
                    Script = dto.Script,
                    Transcript = dto.Transcript,
                    Duration = dto.Duration,
                    SpeedCategory = dto.SpeedCategory,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    TopicID = dto.TopicID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Listenings.Add(listening);

                if (dto.Questions != null)
                {
                    for (int i = 0; i < dto.Questions.Count; i++)
                    {
                        var qDto = dto.Questions[i];
                        string questionImagePath = null;

                        if (!string.IsNullOrEmpty(qDto.ImageURL))
                        {
                            // Lưu ảnh câu hỏi tương tự cách lưu GIF bên Kanji
                            questionImagePath = await FileHelper.SaveBase64Image(qDto.ImageURL, "listening-questions", $"q_{listening.ListeningID}_{i}", _env.WebRootPath);
                        }

                        var question = new Questions
                        {
                            QuestionID = Guid.NewGuid(),
                            ListeningID = listening.ListeningID,
                            Content = qDto.Content,
                            ImageURL = questionImagePath, // Lưu path ảnh
                            LessonID = dto.LessonID,
                            MediaTimestamp = qDto.MediaTimestamp,
                            Explanation = qDto.Explanation,
                            Difficulty = qDto.Difficulty,
                            DisplayOrder = qDto.DisplayOrder > 0 ? qDto.DisplayOrder : i + 1,
                            QuestionType = qDto.QuestionType,
                            Status = QuestionStatus.Active,
                            Answers = qDto.Answers.Select(aDto => new Answers
                            {
                                AnswerID = Guid.NewGuid(),
                                AnswerText = aDto.AnswerText,
                                IsCorrect = aDto.IsCorrect
                            }).ToList()
                        };
                        _context.Questions.Add(question);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Thêm bài nghe thành công", id = listening.ListeningID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi hệ thống: {ex.Message}");
            }
        }

        // 4. Cập nhật bài nghe
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateListeningDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var listening = await _context.Listenings
                    .Include(l => l.Questions).ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(l => l.ListeningID == id);

                if (listening == null) return NotFound("Không tìm thấy bài nghe.");

                // Cập nhật Audio nếu có Base64 mới
                if (!string.IsNullOrEmpty(dto.AudioURL) && dto.AudioURL.StartsWith("data:"))
                {
                    listening.AudioURL = await FileHelper.SaveBase64Image(dto.AudioURL, "listening-audios", $"audio_{id}", _env.WebRootPath);
                }

                listening.Title = dto.Title;
                listening.Script = dto.Script;
                listening.Transcript = dto.Transcript;
                listening.Duration = dto.Duration;
                listening.SpeedCategory = dto.SpeedCategory;
                listening.Status = dto.Status;
                listening.LevelID = dto.LevelID;
                listening.TopicID = dto.TopicID;
                listening.LessonID = dto.LessonID;
                listening.UpdatedAt = DateTime.UtcNow;

                // Xóa câu hỏi cũ (logic giống Kanji là làm sạch rồi add lại cho gọn)
                _context.Questions.RemoveRange(listening.Questions);

                if (dto.Questions != null)
                {
                    for (int i = 0; i < dto.Questions.Count; i++)
                    {
                        var qDto = dto.Questions[i];
                        string currentImagePath = qDto.ImageURL;

                        // Nếu là Base64 mới thì mới lưu file mới
                        if (!string.IsNullOrEmpty(qDto.ImageURL) && qDto.ImageURL.StartsWith("data:image"))
                        {
                            currentImagePath = await FileHelper.SaveBase64Image(qDto.ImageURL, "listening-questions", $"q_{id}_{i}", _env.WebRootPath);
                        }

                        _context.Questions.Add(new Questions
                        {
                            QuestionID = Guid.NewGuid(),
                            ListeningID = id,
                            Content = qDto.Content,
                            ImageURL = currentImagePath,
                            LessonID = dto.LessonID,
                            MediaTimestamp = qDto.MediaTimestamp,
                            Explanation = qDto.Explanation,
                            Difficulty = qDto.Difficulty,
                            DisplayOrder = qDto.DisplayOrder,
                            QuestionType = qDto.QuestionType,
                            Status = QuestionStatus.Active,
                            Answers = qDto.Answers.Select(aDto => new Answers
                            {
                                AnswerID = Guid.NewGuid(),
                                AnswerText = aDto.AnswerText,
                                IsCorrect = aDto.IsCorrect,
                            }).ToList()
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi: {ex.Message}");
            }
        }

        // 5. Xóa bài nghe (Xóa cả file vật lý)
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var listening = await _context.Listenings
                .Include(l => l.Questions)
                .FirstOrDefaultAsync(l => l.ListeningID == id);

            if (listening == null) return NotFound();

            // Xóa file Audio
            if (!string.IsNullOrEmpty(listening.AudioURL))
            {
                var audioPath = Path.Combine(_env.WebRootPath, listening.AudioURL.TrimStart('/'));
                if (System.IO.File.Exists(audioPath)) System.IO.File.Delete(audioPath);
            }

            // Xóa file ảnh của từng câu hỏi
            foreach (var q in listening.Questions)
            {
                if (!string.IsNullOrEmpty(q.ImageURL))
                {
                    var imgPath = Path.Combine(_env.WebRootPath, q.ImageURL.TrimStart('/'));
                    if (System.IO.File.Exists(imgPath)) System.IO.File.Delete(imgPath);
                }
            }

            _context.Listenings.Remove(listening);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bài nghe và các file liên quan" });
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