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
        public async Task<IActionResult> GetSourceMaterials([FromQuery] Guid? lessonId, [FromQuery] string type, [FromQuery] string? levelName)
        {
            try
            {
                bool isAllLessons = !lessonId.HasValue || lessonId == Guid.Empty;
                // Trường hợp lấy Từ vựng
                if (type == "Vocabulary")
                {
                    var query = _context.Vocabularies.AsNoTracking().AsQueryable();

                    // điều kiện lọc WHERE nếu không phải "All Lessons"
                    if (!isAllLessons)
                    {
                        query = query.Where(v => v.LessonID == lessonId);
                    }
                    else if (!string.IsNullOrEmpty(levelName))
                    {
                        query = query.Where(v => v.Lesson.Course.Level.LevelName == levelName);
                    }
                    var vocabs = await query
                        .Select(v => new {
                            Id = v.VocabID,
                            Word = v.Word,
                            Example = v.Examples,
                            Meaning = v.Meaning,
                            Reading = v.Reading,
                            v.AudioURL,
                            TopicIDs = v.VocabTopics.Select(vt => vt.TopicID).ToList()
                        })
                        .Take(100)
                        .ToListAsync();
                    return Ok(vocabs);
                }

                // Trường hợp lấy Ngữ pháp
                if (type == "Grammar")
                {
                    var query = _context.Grammars.AsNoTracking().AsQueryable();
                    if (!isAllLessons)
                    {
                        query = query.Where(g => g.LessonID == lessonId);
                    }
                    else if (!string.IsNullOrEmpty(levelName))
                    {
                        query = query.Where(g => g.Lesson.Course.Level.LevelName == levelName);
                    }
                    var grammars = await query
                        .Select(g => new {
                            Id = g.GrammarID,
                            Title = g.Title,
                            Meaning = g.Explanation,
                            Example = g.Examples,
                            Structure = g.Structure,
                            TopicIDs = g.GrammarTopics.Select(gt => gt.TopicID).ToList()
                        })
                        .Take(100)
                        .ToListAsync();
                    return Ok(grammars);
                }

                // Trường hợp lấy Hán tự (Kanji)
                if (type == "Kanji")
                {
                    var query = _context.Kanjis.AsNoTracking().AsQueryable();
                    if (!isAllLessons)
                    {
                        query = query.Where(k => k.LessonID == lessonId);
                    }
                    else if (!string.IsNullOrEmpty(levelName))
                    {
                        query = query.Where(k => k.Lesson.Course.Level.LevelName == levelName);
                    }
                    var kanjis = await query
                        .Select(k => new {
                            Id = k.KanjiID,
                            Character = k.Character, // Chữ Hán
                            Meaning = k.Meaning,   // Nghĩa Hán Việt/Ý nghĩa
                            Onyomi = k.Onyomi,
                            Kunyomi = k.Kunyomi // Cách đọc để làm đáp án
                        })
                        .Take(100)
                        .ToListAsync();
                    return Ok(kanjis);
                }

                if (type == "Reading")
                {
                    var query = _context.Readings.AsQueryable();
                    if (!isAllLessons)
                    {
                        query = query.Where(r => r.LessonID == lessonId);
                    }
                    else if (!string.IsNullOrEmpty(levelName))
                    {
                        query = query.Where(r => r.Lesson.Course.Level.LevelName == levelName);
                    }
                    var readings = await query
                        .Select(r => new {
                            Id = r.ReadingID,
                            Title = r.Title,     // Hiển thị tiêu đề bài đọc ở cột trái
                            Content = r.Content,   // Nội dung để auto-fill vào Content câu hỏi
                            Translation = r.Translation,
                            TopicIDs = r.ReadingTopics.Select(rt => rt.TopicID).ToList()
                        })
                        .Take(100)
                        .ToListAsync();
                    return Ok(readings);
                }

                // Trường hợp lấy Bài nghe (Listening)
                if (type == "Listening")
                {
                    var query = _context.Listenings.AsQueryable();
                    if (!isAllLessons)
                    {
                        query = query.Where(l => l.LessonID == lessonId);
                    }
                    else if (!string.IsNullOrEmpty(levelName))
                    {
                        query = query.Where(l => l.Lesson.Course.Level.LevelName == levelName);
                    }
                    var listenings = await query
                        .Select(l => new {
                            Id = l.ListeningID,
                            Title = l.Title,
                            AudioURL = l.AudioURL, // Link audio để auto-fill vào MediaURL
                            Transcript = l.Transcript,
                            TopicIDs = l.ListeningTopics.Select(lt => lt.TopicID).ToList()
                        })
                        .Take(100)
                        .ToListAsync();
                    return Ok(listenings);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, inner = ex.InnerException?.Message });
            }

            return Ok(new List<object>());
        }

        [HttpGet("lessons-lookup")]
        public async Task<IActionResult> GetLessonsLookup()
        {
            var lessons = await _context.Lessons
                .Select(l => new {
                    l.LessonID,
                    l.Title,
                    LevelValue = l.Course.Level.LevelID,
                    LevelName = l.Course.Level.LevelName
                })
                .ToListAsync();
            return Ok(lessons);
        }

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() =>
            Ok(await _context.Topics.Select(t => new { topicID = t.TopicID, topicName = t.TopicName }).ToListAsync());

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
                    Explanation = dto.Explanation,
                    EquivalentID = dto.EquivalentID,
                    Status = dto.Status,
                    SourceID = dto.SourceID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow
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

        // Cập nhật câu hỏi
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuestion(Guid id, [FromBody] CreateQuestionDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var question = await _context.Questions.FindAsync(id);
                if (question == null) return NotFound();

                // 1. Cập nhật thông tin cơ bản
                question.Content = dto.Content;
                question.QuestionType = dto.QuestionType;
                question.Difficulty = dto.Difficulty;
                question.Explanation = dto.Explanation;
                question.Status = dto.Status;
                question.LessonID = dto.LessonID;
                question.SkillType = dto.SkillType;
                question.UpdatedAt = DateTime.UtcNow;
                question.EquivalentID = dto.EquivalentID;

                // 2. Cập nhật Answers (Xóa cũ - Thêm mới để đảm bảo đồng bộ)
                var oldAnswers = _context.Answers.Where(a => a.QuestionID == id);
                _context.Answers.RemoveRange(oldAnswers);

                foreach (var ans in dto.Answers)
                {
                    _context.Answers.Add(new Answers
                    {
                        AnswerID = Guid.NewGuid(),
                        QuestionID = id,
                        AnswerText = ans.AnswerText,
                        IsCorrect = ans.IsCorrect
                    });
                }

                // 3. Cập nhật Topics
                var oldTopics = _context.Set<Questions_Topic>().Where(qt => qt.QuestionID == id);
                _context.Set<Questions_Topic>().RemoveRange(oldTopics);

                if (dto.TopicIds != null)
                {
                    foreach (var tId in dto.TopicIds)
                    {
                        _context.Set<Questions_Topic>().Add(new Questions_Topic
                        {
                            QuestionID = id,
                            TopicID = tId
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

                // Lấy thông báo lỗi sâu nhất (thường là lỗi từ Database)
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;

                // Log ra console của Server để bạn xem trong Visual Studio/Rider
                Console.WriteLine($"UPDATE ERROR: {detailedError}");

                // Trả về lỗi 400 kèm theo chi tiết để Frontend hiển thị được
                return BadRequest(new
                {
                    message = "Lỗi lưu dữ liệu xuống Database",
                    detail = detailedError
                });
            }
        }

        // CÁC API CẦN CÓ ĐỂ HIỂN THỊ DANH SÁCH CÂU HỎI

        [HttpGet]
        public async Task<IActionResult> GetQuestions([FromQuery] Guid? lessonId, [FromQuery] Guid? topicId,
            [FromQuery] int? difficulty, [FromQuery] QuestionType? type, [FromQuery] string? searchTerm)
        {
            var query = _context.Questions
                .Include(q => q.Lesson)
                .Include(q => q.QuestionTopics)
                .Include(q => q.SubQuestions)
                .AsNoTracking()
                .AsQueryable();

            // 1. Lọc theo Lesson
            if (lessonId.HasValue && lessonId != Guid.Empty)
                query = query.Where(q => q.LessonID == lessonId);

            // 2. Lọc theo Topic 
            if (topicId.HasValue)
                query = query.Where(q => q.QuestionTopics.Any(qt => qt.TopicID == topicId));

            // 3. Lọc theo Độ khó và Loại
            if (difficulty.HasValue) query = query.Where(q => q.Difficulty == difficulty);
            if (type.HasValue) query = query.Where(q => q.QuestionType == type);

            // 4. Tìm kiếm nội dung
            if (!string.IsNullOrEmpty(searchTerm))
                query = query.Where(q => q.Content.Contains(searchTerm));

            // Sắp xếp theo UpdatedAt, vì nó luôn có giá trị (mặc định bằng CreatedAt)
            query = query.OrderByDescending(q => q.UpdatedAt);
            var result = await query.Select(q => new QuestionListDTO
            {
                QuestionID = q.QuestionID,
                Content = q.Content,
                QuestionType = q.QuestionType,
                Difficulty = q.Difficulty,
                Status = q.Status,
                HasAudio = !string.IsNullOrEmpty(q.AudioURL),
                LessonName = q.Lesson.Title,
                TopicName = q.QuestionTopics.Select(qt => qt.Topic.TopicName).ToList(),
                LinkedCount = q.SubQuestions.Count + (q.EquivalentID.HasValue ? 1 : 0)
            }).ToListAsync();

            return Ok(result);
        }

        // Lấy chi tiết để đổ vào Form Edit
        [HttpGet("{id}")]
        public async Task<IActionResult> GetQuestionDetail(Guid id)
        {
            var question = await _context.Questions
        .Include(q => q.Answers)
        .Include(q => q.QuestionTopics)
        .FirstOrDefaultAsync(q => q.QuestionID == id);

            if (question == null) return NotFound();

            // Chỉ trả về những gì Frontend thực sự cần
            var result = new
            {
                question.QuestionID,
                question.LessonID,
                question.Content,
                question.QuestionType,
                question.Difficulty,
                question.Explanation,
                question.Status,
                question.SourceID,
                question.MediaTimestamp,
                // Map Answers để loại bỏ thuộc tính ngược 'Question'
                Answers = question.Answers.Select(a => new {
                    a.AnswerID,
                    a.AnswerText,
                    a.IsCorrect
                }),
                // Map Topics để lấy danh sách ID
                QuestionTopics = question.QuestionTopics.Select(qt => new {
                    qt.TopicID
                })
            };

            return Ok(result);
        }


        [HttpGet("{id}/links")]
        public async Task<IActionResult> GetQuestionLinks(Guid id)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null) return NotFound();

            // Lấy các câu hỏi con HOẶC các câu hỏi có cùng EquivalentID
            var links = await _context.Questions
                .Where(q =>
            // 1. Quan hệ Cha - Con truyền thống
            q.ParentID == id ||

            // 2. TÌM THEO CẤU TRÚC DỮ LIỆU CỦA BẠN:
            // a. Tìm câu hỏi mà ID của nó chính là EquivalentID của câu hiện tại
            (question.EquivalentID != null && q.QuestionID == question.EquivalentID) ||

            // b. Tìm các câu hỏi khác đang trỏ EquivalentID về câu hiện tại
            (q.EquivalentID == id) ||

            // c. Tìm các câu cùng trỏ về một EquivalentID (Anh em)
            (question.EquivalentID != null && q.EquivalentID == question.EquivalentID && q.QuestionID != id)
        )
        .Select(q => new {
            q.QuestionID,
            q.Content,
            Relation = "Tương đương"
        })
        .ToListAsync();
            return Ok(links);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] Status status)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null) return NotFound();

            question.Status = status;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}