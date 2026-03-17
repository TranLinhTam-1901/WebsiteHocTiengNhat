using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using QuizzTiengNhat.DTOs.Admin;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/question-bank")]
    [Authorize(Roles = "Admin")]
    public class QuestionBankAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QuestionBankAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("source-materials")]
        public async Task<IActionResult> GetSourceMaterials([FromQuery] Guid? lessonId, [FromQuery] string type)
        {
            bool isAllLessons = !lessonId.HasValue || lessonId == Guid.Empty;

            // 1. Trường hợp Từ vựng
            if (type == "Vocabulary")
            {
                var query = _context.Vocabularies.Include(v => v.VocabTopics).AsQueryable();
                if (!isAllLessons) query = query.Where(v => v.LessonID == lessonId);

                var vocabs = await query
                    .Select(v => new {
                        Id = v.VocabID,
                        Word = v.Word,
                        Meaning = v.Meaning,
                        Reading = v.Reading,
                        v.AudioURL,
                        // Lấy danh sách ID chủ đề thay vì 1 ID duy nhất
                        TopicIDs = v.VocabTopics.Select(vt => vt.TopicID).ToList()
                    })
                    .Take(10) // Tăng lên một chút cho admin dễ chọn
                    .ToListAsync();
                return Ok(vocabs);
            }

            // 2. Trường hợp Ngữ pháp
            if (type == "Grammar")
            {
                var query = _context.Grammars.Include(g => g.GrammarTopics).AsQueryable();
                if (!isAllLessons) query = query.Where(g => g.LessonID == lessonId);

                var grammars = await query
                    .Select(g => new {
                        Id = g.GrammarID,
                        Title = g.Title,
                        Meaning = g.Meaning,
                        Structure = g.Structure,
                        TopicIDs = g.GrammarTopics.Select(gt => gt.TopicID).ToList()
                    })
                    .Take(10)
                    .ToListAsync();
                return Ok(grammars);
            }

            // 3. Trường hợp Hán tự (Kanji thường không chia theo Topic mà theo Lesson/Radical)
            if (type == "Kanji")
            {
                var query = _context.Kanjis.AsQueryable();
                if (!isAllLessons) query = query.Where(k => k.LessonID == lessonId);

                var kanjis = await query
                    .Select(k => new {
                        Id = k.KanjiID,
                        Character = k.Character,
                        Meaning = k.Meaning,
                        Onyomi = k.Onyomi,
                        Kunyomi = k.Kunyomi
                    })
                    .Take(10)
                    .ToListAsync();
                return Ok(kanjis);
            }

            // 4. Trường hợp Bài đọc
            if (type == "Reading")
            {
                var query = _context.Readings.Include(r => r.ReadingTopics).AsQueryable();
                if (!isAllLessons) query = query.Where(r => r.LessonID == lessonId);

                var readings = await query
                    .Select(r => new {
                        Id = r.ReadingID,
                        Title = r.Title,
                        Content = r.Content,
                        TopicIDs = r.ReadingTopics.Select(rt => rt.TopicID).ToList()
                    })
                    .Take(10)
                    .ToListAsync();
                return Ok(readings);
            }

            // 5. Trường hợp Bài nghe
            if (type == "Listening")
            {
                var query = _context.Listenings.Include(l => l.ListeningTopics).AsQueryable();
                if (!isAllLessons) query = query.Where(l => l.LessonID == lessonId);

                var listenings = await query
                    .Select(l => new {
                        Id = l.ListeningID,
                        Title = l.Title,
                        AudioURL = l.AudioURL,
                        TopicIDs = l.ListeningTopics.Select(lt => lt.TopicID).ToList()
                    })
                    .Take(10)
                    .ToListAsync();
                return Ok(listenings);
            }

            return Ok(new List<object>());
        }

        // Các phương thức Lookup và Search giữ nguyên vì không bị ảnh hưởng bởi Many-to-Many Topics
        [HttpGet("lessons-lookup")]
        public async Task<IActionResult> GetLessonsLookup()
        {
            var lessons = await _context.Lessons
                .Include(l => l.Course).ThenInclude(c => c.Level)
                .Select(l => new {
                    l.LessonID,
                    l.Title,
                    LevelName = l.Course.Level.LevelName
                })
                .ToListAsync();
            return Ok(lessons);
        }

        [HttpGet("topics")]
        public async Task<IActionResult> GetTopics()
        {
            return Ok(await _context.Topics.Select(t => new { t.TopicID, t.TopicName }).ToListAsync());
        }

        // Tạo câu hỏi: Đảm bảo bảng trung gian là Questions_Topic (đúng với DbContext)
        [HttpPost("create")]
        public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var question = new Questions
                {
                    QuestionID = Guid.NewGuid(),
                    Content = dto.Content,
                    QuestionType = dto.QuestionType,
                    Difficulty = dto.Difficulty,
                    AudioURL = dto.AudioURL,
                    MediaTimestamp = dto.MediaTimestamp,
                    Explanation = dto.Explanation,
                    EquivalentID = dto.EquivalentID,
                    Status = dto.Status,
                    SourceID = dto.SourceID,
                    LessonID = dto.LessonID
                };
                _context.Questions.Add(question);

                // Thêm Answers
                if (dto.Answers != null)
                {
                    foreach (var ans in dto.Answers)
                    {
                        _context.Answers.Add(new Answers
                        {
                            AnswerID = Guid.NewGuid(),
                            QuestionID = question.QuestionID,
                            AnswerText = ans.AnswerText,
                            IsCorrect = ans.IsCorrect
                        });
                    }
                }

                // Gán Topics vào bảng trung gian Questions_Topic
                if (dto.TopicIds != null)
                {
                    foreach (var topicId in dto.TopicIds)
                    {
                        // Đảm bảo tên class là Questions_Topic như bạn đã khai báo trong DbContext
                        _context.Questions_Topics.Add(new Questions_Topic
                        {
                            QuestionID = question.QuestionID,
                            TopicID = topicId
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Thành công!", questionId = question.QuestionID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // 3. Tìm kiếm câu hỏi để thiết lập "Cặp câu hỏi tương đương"
        [HttpGet("search-equivalent")]
        public async Task<IActionResult> SearchEquivalent([FromQuery] string query)
        {
            var questions = await _context.Questions
                .Where(q => q.Content.Contains(query))
                .Select(q => new { q.QuestionID, q.Content, q.QuestionType, q.Difficulty })
                .Take(10)
                .ToListAsync();
            return Ok(questions);
        }
    }
}