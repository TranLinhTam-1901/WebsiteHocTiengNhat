using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using QuizzTiengNhat.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;

[ApiController] 
[Route("api/admin/exams")]
[Authorize(Roles = "Admin")]
public class ExamsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExamsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. GET: api/Exams/templates/standards/{level}
    [HttpGet("templates/standards/{level}")]
    public async Task<IActionResult> GetStandardTemplate(Guid level)
    {
        // Giả định bạn có bảng ExamTemplates lưu cấu trúc chuẩn
        var template = await _context.ExamTemplates
            .Include(t => t.Details)
            .FirstOrDefaultAsync(t => t.LevelID == level );

        if (template == null) return NotFound("Không tìm thấy cấu trúc chuẩn.");

        var response = new ExamTemplateResponseDTO
        {
            Title = template.Title,
            Duration = template.Duration,
            PassingScore = template.PassingScore,
            // Fill thêm 3 trường này từ Database vào
            MinLanguageKnowledgeScore = template.MinLanguageKnowledgeScore,
            MinReadingScore = template.MinReadingScore,
            MinListeningScore = template.MinListeningScore,
            
            Details = template.Details.Select(d => new ExamPartConfigDTO
            {
                SkillType = d.SkillType,
                Quantity = d.Quantity,
                PointPerQuestion = d.PointPerQuestion
            }).ToList()
        };
        return Ok(response);
    }

    [HttpGet("skills")]
    public IActionResult GetSkills()
    {
        // Lấy ra danh sách các Enum QuestionType đã định nghĩa
        var skills = Enum.GetValues(typeof(QuestionType))
        .Cast<QuestionType>()
        .Select(s => new { 
            Id = (int)s, 
            Name = s.ToString() 
        });
        return Ok(skills);
    }
    // 2. GET: api/Exams/lessons
    [HttpGet("lessons")]
    public async Task<IActionResult> GetLessons()
    {
        var lessons = await _context.Lessons
            .Select(l => new { l.LessonID, l.Title })
            .ToListAsync();
        return Ok(lessons);
    }

    [HttpGet("levels")]
    public async Task<IActionResult> GetLevelsLookup()
    {
        // Giả sử bạn dùng Entity Framework
        var levels = await _context.JLPT_Levels
            .OrderBy(l => l.LevelName) // N1 -> N5 hoặc ngược lại
            .Select(l => new {
                LevelID = l.LevelID,
                LevelName = l.LevelName // Trả về "N1", "N2", "N3"...
            })
            .ToListAsync();

        return Ok(levels);
    }
    
    // 3. POST: api/Exams/generate
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateExam([FromBody] GenerateExamRequestDTO request)
    {
        if (request.Parts == null || !request.Parts.Any())
            return BadRequest("Cấu trúc đề không được để trống.");

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                // Bước 1: Tạo bản ghi Exams
                var exam = new Exams
                {
                    ExamID = Guid.NewGuid(),
                    Title = request.Title,
                    Duration = request.Duration,
                    LevelID = request.LevelID,
                    Type = request.Type, 
                    LessonID = request.LessonID,
                    ShowResultImmediately = request.ShowResultImmediately,
                    PassingScore = request.PassingScore,
                    MinLanguageKnowledgeScore = request.MinLanguageKnowledgeScore,
                    MinReadingScore = request.MinReadingScore,
                    MinListeningScore = request.MinListeningScore,
                    CreatedAt = DateTime.UtcNow,
                    IsPublished = true
                };

                _context.Exams.Add(exam);

                int currentOrder = 1;

                // Bước 2: Duyệt qua từng phần cấu hình để bốc câu hỏi
                foreach (var part in request.Parts)
                {
                    var query = _context.Questions.AsQueryable();

                    // Lọc câu hỏi theo loại và cấp độ
                    query = query.Where(q => q.SkillType == part.SkillType);
                    
                    if (request.Type == ExamType.LessonPractice && request.LessonID.HasValue)
                        query = query.Where(q => q.LessonID == request.LessonID);
                    else
                        query = query.Where(q => q.Lesson.Course.LevelID == request.LevelID);

                    // Logic Random: NEWID() trong SQL
                    var selectedQuestions = await query
                        .OrderBy(q => Guid.NewGuid()) 
                        .Take(part.Quantity)
                        .ToListAsync();

                    if (selectedQuestions.Count < part.Quantity)
                        throw new Exception($"Không đủ câu hỏi cho phần {part.SkillType}. Cần {part.Quantity}, có {selectedQuestions.Count}");

                    // Bước 3: Lưu vào Exam_Questions
                    foreach (var q in selectedQuestions)
                    {
                        var examQuestion = new Exam_Questions
                        {
                            ExamQuestionID = Guid.NewGuid(),
                            ExamID = exam.ExamID,
                            QuestionID = q.QuestionID,
                            OrderIndex = currentOrder++,
                            Score = part.PointPerQuestion 
                        };
                        _context.Exam_Questions.Add(examQuestion);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, examId = exam.ExamID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                // 1. Tìm lỗi chi tiết nhất (InnerException)
                var detailedError = ex.InnerException != null 
                    ? ex.InnerException.Message 
                    : ex.Message;

                // 2. Nếu là lỗi của EF Core (DbUpdateException), nó thường nằm sâu hơn nữa
                if (ex is Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
                {
                    detailedError = dbEx.InnerException?.Message ?? dbEx.Message;
                }

                // 3. In ra Console của Visual Studio để bạn copy được toàn bộ chuỗi lỗi
                Console.WriteLine("======= EXAM GENERATION ERROR =======");
                Console.WriteLine(ex.ToString()); 
                Console.WriteLine("=====================================");

                return BadRequest(new 
                { 
                    success = false,
                    message = "Lỗi hệ thống khi lưu dữ liệu.",
                    detail = detailedError, // Đây là thứ bạn cần
                    stackTrace = ex.StackTrace // Chỉ nên dùng khi đang Debug
                });
            }
        }
    }

    // 4. POST: api/Exams/summary
    [HttpPost("summary")]
    public IActionResult GetSummary([FromBody] List<ExamPartConfigDTO> parts)
    {
        if (parts == null) return BadRequest();

        int totalQuestions = parts.Sum(p => p.Quantity);
        // Tính toán bằng decimal sẽ đảm bảo độ chính xác tuyệt đối
        decimal totalScore = parts.Sum(p => (decimal)p.Quantity * p.PointPerQuestion);

        return Ok(new 
        { 
            TotalQuestions = totalQuestions, 
            TotalScore = totalScore 
        });
    }

    [HttpGet("lessons-by-level/{levelId}")]
    public async Task<IActionResult> GetLessonsByLevel(Guid levelId)
    {
        var lessons = await _context.Lessons
            .Where(l => l.Course.LevelID == levelId)
            .OrderBy(l => l.Title)
            .Select(l => new {
                l.LessonID,
                l.Title,
                RawQuestionCount = _context.Questions.Count(q => q.LessonID == l.LessonID), 
                SkillStats = _context.Questions
                    .Where(q => q.LessonID == l.LessonID)
                    .GroupBy(q => q.SkillType)
                    .Select(g => new {
                        SkillId = (int)g.Key,
                        SkillName = g.Key.ToString(),
                        TotalQuestions = g.Count()
                    }).ToList()
            })
            .ToListAsync();

        return Ok(lessons);
    }

    [HttpGet("stats-by-skill/{levelId}")]
    public async Task<IActionResult> GetStatsBySkill(Guid levelId)
    {
        var stats = await _context.Questions
            .Where(q => q.Lesson.Course.LevelID == levelId)
            .GroupBy(q => q.SkillType) 
            .Select(g => new {
                SkillId = (int)g.Key,
                SkillName = g.Key.ToString(),
                TotalAvailable = g.Count()
            })
            .ToListAsync();

        return Ok(stats);
    }
    // LIST DANH SÁCH ĐỀ THI //

        [HttpGet]
        public async Task<IActionResult> GetExams(
            [FromQuery] string? search, 
            [FromQuery] Guid? levelId, 
            [FromQuery] ExamType? type)
        {
            // 1. Khởi tạo Query với AsNoTracking để tối ưu Performance
            var query = _context.Exams.AsNoTracking();

            // 2. Logic Lọc (Filtering)
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(e => e.Title.Contains(search));
            }

            if (levelId.HasValue)
            {
                query = query.Where(e => e.LevelID == levelId);
            }

            if (type.HasValue)
            {
                query = query.Where(e => e.Type == type);
            }

            // 3. Thực thi Query và ánh xạ sang DTO
            var result = await query
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new ExamListResponseDTO
                {
                    ExamID = e.ExamID,
                    Title = e.Title,
                    LevelName = e.Level != null ? e.Level.LevelName : "N/A",
                    Type = e.Type, 
                    LessonTitle = e.Lesson != null ? e.Lesson.Title : null,
                    TotalQuestions = e.ExamQuestions.Count(),
                    TotalScore = (double)e.ExamQuestions.Sum(q => q.Score),
                    Duration = e.Duration,
                    CreatedAt = e.CreatedAt,
                    IsPublished = e.IsPublished
                })
                .ToListAsync();

            // 4. Trả về kết quả HTTP 200 kèm dữ liệu
            return Ok(result);
        }

        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetExamDetails(Guid id)
        {
            var exam = await _context.Exams
                .Include(e => e.Level)
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                .FirstOrDefaultAsync(e => e.ExamID == id);

            if (exam == null) return NotFound("Không tìm thấy đề thi.");

            var details = new
            {
                exam.ExamID,
                exam.Title,
                exam.PassingScore,
                // Các mốc điểm liệt thực tế từ Database
                MinScores = new {
                    Language = exam.MinLanguageKnowledgeScore,
                    Reading = exam.MinReadingScore,
                    Listening = exam.MinListeningScore
                },
                // Danh sách câu hỏi để hiển thị ở sidebar "Inspection"
                Questions = exam.ExamQuestions
                    .OrderBy(eq => eq.OrderIndex)
                    .Select(eq => new {
                        eq.QuestionID,
                        eq.OrderIndex,
                        Content = eq.Question.Content,
                        SkillType = eq.Question.SkillType.ToString(),
                        Score = eq.Score
                    }).ToList()
            };

            return Ok(details);
        }

        [HttpPatch("{id}/publish")]
        public async Task<IActionResult> TogglePublish(Guid id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null) return NotFound("Không tìm thấy đề thi.");

            // Đảo ngược trạng thái hiện tại
            exam.IsPublished = !exam.IsPublished;
            
            try 
            {
                await _context.SaveChangesAsync();
                return Ok(new { 
                    success = true, 
                    isPublished = exam.IsPublished,
                    message = exam.IsPublished ? "Đã công khai đề thi." : " đã ẩn đề thi." 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

    }



