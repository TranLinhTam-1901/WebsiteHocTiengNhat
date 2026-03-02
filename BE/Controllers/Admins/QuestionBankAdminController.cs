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

        // 1. Lấy danh sách phôi chất liệu từ Task 1 để "Pick"
        [HttpGet("source-materials")]
        public async Task<IActionResult> GetSourceMaterials([FromQuery] Guid? lessonId, [FromQuery] string type)
        {
            bool isAllLessons = !lessonId.HasValue || lessonId == Guid.Empty;
            // Trường hợp lấy Từ vựng
            if (type == "Vocabulary")
            {
                var query = _context.Vocabularies.AsQueryable();
        
               // điều kiện lọc WHERE nếu không phải "All Lessons"
                if (!isAllLessons) {
                    query = query.Where(v => v.LessonID == lessonId);
                }
                var vocabs = await query
                    .Select(v => new { 
                        Id = v.VocabID, 
                        Word = v.Word, 
                        Example = v.Example,
                        Meaning = v.Meaning, 
                        Reading = v.Reading,
                        v.AudioURL, 
                        v.TopicID 
                    })
                    .Take(5)
                    .ToListAsync();
                return Ok(vocabs);
            }

            // Trường hợp lấy Ngữ pháp
            if (type == "Grammar")
            {
                var query = _context.Grammars.AsQueryable();
                if (!isAllLessons) {
                    query = query.Where(g => g.LessonID == lessonId);
                }
                var grammars = await query
                    .Select(g => new {
                        Id = g.GrammarID,
                        Title = g.Title, 
                        Meaning = g.Explanation, 
                        Example = g.Example, 
                        Structure = g.Structure,
                        g.TopicID
                    })
                    .Take(5)
                    .ToListAsync();
                return Ok(grammars);
            }

            // Trường hợp lấy Hán tự (Kanji)
            if (type == "Kanji")
            {
                var query = _context.Kanjis.AsQueryable();
                if (!isAllLessons) {
                    query = query.Where(g => g.LessonID == lessonId);
                }
                var kanjis = await query
                    .Select(k => new {
                        Id = k.KanjiID,
                        Character = k.Character, // Chữ Hán
                        Meaning = k.Meaning,   // Nghĩa Hán Việt/Ý nghĩa
                        Onyomi = k.Onyomi,
                        Kunyomi = k.Kunyomi // Cách đọc để làm đáp án
                    })
                    .Take(5)
                    .ToListAsync();
                return Ok(kanjis);
            }

            if (type == "Reading")
            {
                var query = _context.Readings.AsQueryable();
                if (!isAllLessons) {
                    query = query.Where(g => g.LessonID == lessonId);
                }
                var readings = await query
                    .Select(r => new {
                        Id = r.ReadingID,
                        Title = r.Title,     // Hiển thị tiêu đề bài đọc ở cột trái
                        Content = r.Content,   // Nội dung để auto-fill vào Content câu hỏi
                        Translation = r.Translation,
                        r.TopicID
                    })
                    .Take(5)
                    .ToListAsync();
                return Ok(readings);
            }

            // Trường hợp lấy Bài nghe (Listening)
            if (type == "Listening")
            {
                var query = _context.Listenings.AsQueryable();
                if (!isAllLessons) {
                    query = query.Where(g => g.LessonID == lessonId);
                }
                var listenings = await query
                    .Select(l => new {
                        Id = l.ListeningID,
                        Title = l.Title,
                        AudioURL = l.AudioURL, // Link audio để auto-fill vào MediaURL
                        Transcript = l.Transcript,
                        l.TopicID
                    })
                    .Take(5)
                    .ToListAsync();
                return Ok(listenings);
            }

            // Nếu không khớp loại nào, trả về danh sách trống
            return Ok(new List<object>());
        }
        
        [HttpGet("lessons-lookup")]
        public async Task<IActionResult> GetLessonsLookup()
        {
            var lessons = await _context.Lessons
                .Select(l => new { 
                    l.LessonsID, 
                    l.Title, 
                    LevelValue = l.Course.Level.LevelID, 
                    LevelName = l.Course.Level.LevelName
                    })
                .ToListAsync();
            return Ok(lessons);
        }

        // 2. Lấy toàn bộ Topics để gán nhãn cho câu hỏi
        [HttpGet("topics")]
        public async Task<IActionResult> GetTopics()
        {
            var topics = await _context.Topics
            .Select(t => new 
            {
                t.TopicID,
                t.TopicName,
            })
            .ToListAsync();

        return Ok(topics);
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

        // 4. Tạo câu hỏi hoàn chỉnh (Gồm Question + Answers + Topics)
        [HttpPost("create")]
        public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Bước 1: Tạo đối tượng Question
                var question = new Questions
                {
                    QuestionID = Guid.NewGuid(),
                    Content = dto.Content,
                    QuestionType = dto.QuestionType, // Sử dụng Enum
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

                // Bước 2: Thêm danh sách đáp án
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

                // Bước 3: Gán các chủ đề vào bảng trung gian (Questions_Topic)
                if (dto.TopicIds != null)
                {
                    foreach (var topicId in dto.TopicIds)
                    {
                        // Giả sử tên thực thể bảng trung gian của bạn là QuestionTopic
                        var qt = new Questions_Topic { QuestionID = question.QuestionID, TopicID = topicId };
                        _context.Set<Questions_Topic>().Add(qt);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Đã tạo câu hỏi và đáp án thành công!", questionId = question.QuestionID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                // Lấy lỗi sâu nhất (InnerException) - Nơi Database than phiền
                var message = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest(new { error = "Lỗi Database chi tiết", detail = message });
            }
        }
    }
}