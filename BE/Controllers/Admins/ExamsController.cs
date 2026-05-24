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
                QuestionFormat = d.QuestionFormat,
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
    

    [HttpGet("lessons")]
    public async Task<IActionResult> GetLessons()
    {
        var lessons = await _context.Lessons
            .Select(l => new { l.LessonID, l.Title })
            .ToListAsync();
        return Ok(lessons);
    }

    private sealed record MockTestQuestionTarget(QuestionType QuestionType, int Quantity);

    
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
    
    
    private async Task<List<Questions>> GetGroupedReadingQuestions(
    IQueryable<Questions> query,
    int quantity)
    {
        var readingGroups = (await query
            .Where(q => q.ReadingID != null)
            .ToListAsync())
            .GroupBy(q => q.ReadingID)
            .OrderBy(g => Guid.NewGuid())
            .ToList();

        var selectedQuestions = new List<Questions>();

        int selectedGroupCount = 0;

        foreach (var group in readingGroups)
        {
            selectedQuestions.AddRange(group);

            selectedGroupCount++;

            if (selectedGroupCount >= quantity)
                break;
        }

        return selectedQuestions;
    }

    private async Task<List<Questions>> GetGroupedListeningQuestions(
    IQueryable<Questions> query,
    int quantity)
    {
        var listeningGroups = (await query
            .Where(q => q.ListeningID != null)
            .ToListAsync())
            .GroupBy(q => q.ListeningID)
            .OrderBy(g => Guid.NewGuid())
            .ToList();

        var selectedQuestions = new List<Questions>();

        int selectedGroupCount = 0;

        foreach (var group in listeningGroups)
        {
            selectedQuestions.AddRange(group);

            selectedGroupCount++;

            if (selectedGroupCount >= quantity)
                break;
        }

        return selectedQuestions;
    }


    private async Task<List<Questions>> GetQuestionsForExamPart(
    IQueryable<Questions> query,
    SkillType skillType,
    int quantity)
    {
        switch (skillType)
        {
            case SkillType.Reading:
                return await GetGroupedReadingQuestions(query, quantity);

            case SkillType.Listening:
                return await GetGroupedListeningQuestions(query, quantity);

            default:
                return await query
                    .Include(q => q.Lesson)
                    .OrderBy(q => Guid.NewGuid())
                    .Take(quantity)
                    .ToListAsync();
        }
    }

   //Kiểm tra các điều kiện hợp lệ trước khi tạo đề thi mới hoặc cập nhật đề thi (để tránh lỗi trùng lặp tiêu đề, trùng lặp bài luyện tập theo bài học...)
    private async Task ValidateExamRequest(GenerateExamRequestDTO request)
    {
        var isTitleExisted = await _context.Exams
            .AnyAsync(e => e.Title.ToLower() == request.Title.ToLower());

        if (isTitleExisted)
        {
            throw new Exception(
                $"Tiêu đề đề thi '{request.Title}' đã tồn tại."
            );
        }

        if (request.Type == ExamType.LessonPractice &&
            request.LessonID.HasValue)
        {
            var isExisted = await _context.Exams.AnyAsync(e =>
                e.LessonID == request.LessonID &&
                e.Type == ExamType.LessonPractice);

            if (isExisted)
            {
                throw new Exception(
                    "Bài học này đã có bài luyện tập."
                );
            }
        }

        if (request.Type == ExamType.SkillPractice)
        {
            if (request.Parts == null || !request.Parts.Any())
                throw new Exception("Luyện tập kỹ năng phải chọn 1 kỹ năng.");

            var distinctSkills = request.Parts
                .Select(p => p.SkillType)
                .Distinct()
                .Count();

            if (distinctSkills != 1)
                throw new Exception("Luyện tập kỹ năng chỉ được phép chọn đúng 1 kỹ năng.");
        }
    }
    private async Task<Lessons?> GetLessonIfNeeded(
    GenerateExamRequestDTO request)
    {
        if (!request.LessonID.HasValue)
            return null;

        var lesson = await _context.Lessons
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.LessonID == request.LessonID);

        if (lesson == null &&
            request.Type == ExamType.LessonPractice)
        {
            throw new Exception("Không tìm thấy bài học.");
        }

        return lesson;
    }

    private SkillType? ResolveTargetSkill(GenerateExamRequestDTO request)
    {
        if (request.Type != ExamType.SkillPractice)
        return null;

        var skills = request.Parts?
            .Select(p => (SkillType)p.SkillType)
            .Distinct()
            .ToList();

        return skills?.SingleOrDefault();
    }

    private async Task<Exams> CreateExamEntity(
    GenerateExamRequestDTO request,
    Lessons? lesson,
    SkillType? targetSkill)
    {
        var exam = new Exams
        {
            ExamID = Guid.NewGuid(),

            TemplateID = request.TemplateID,

            Title = request.Title,
            Duration = request.Duration,
            LevelID = request.LevelID,

            Type = request.Type,
            TargetSkill = targetSkill,

            LessonID = request.LessonID,

            ShowResultImmediately = request.ShowResultImmediately,

            PassingScore = request.PassingScore,
            MinLanguageKnowledgeScore = request.MinLanguageKnowledgeScore,
            MinReadingScore = request.MinReadingScore,
            MinListeningScore = request.MinListeningScore,

            CreatedAt = DateTime.UtcNow,

            IsPublished = true,

            CourseID = lesson?.CourseID,
            SortOrder = lesson?.SortOrder ?? 0,

            Version = 1
        };

        _context.Exams.Add(exam);

        return exam;
    }
    
    private async Task<int> ProcessExamPart(
    GenerateExamRequestDTO request,
    Exams exam,
    ExamPartConfigDTO part,
    int currentOrder)
    {
        var query = BuildQuestionQuery(request, part);

        var selectedQuestions = await GetQuestionsForExamPart(
            query,
            part.SkillType,
            part.Quantity
        );

        if (selectedQuestions.Count < part.Quantity)
        {
            throw new Exception(
                $"Không đủ câu hỏi cho phần {part.SkillType}"
            );
        }

        foreach (var q in selectedQuestions)
        {
            _context.Exam_Questions.Add(new Exam_Questions
            {
                ExamQuestionID = Guid.NewGuid(),
                ExamID = exam.ExamID,
                QuestionID = q.QuestionID,

                OrderIndex = currentOrder++,

                ReadingID = q.ReadingID,
                ListeningID = q.ListeningID,

                Score = part.PointPerQuestion,

                Version = 1
            });
        }

        return currentOrder;
    }

    private IQueryable<Questions> BuildQuestionQuery(
    GenerateExamRequestDTO request,
    ExamPartConfigDTO part)
    {
        var query = _context.Questions
            .Include(q => q.Lesson)
            .AsQueryable();

        query = query.Where(q =>
            q.SkillType == part.SkillType);

        //EXAMTYPE = 0
        if (request.Type == ExamType.MockTest)
        {
            query = query.Where(q =>
                q.QuestionFormat == part.QuestionFormat);
        }

        if (request.Type == ExamType.LessonPractice &&
            request.LessonID.HasValue)
        {
            query = query.Where(q =>
                q.LessonID == request.LessonID);
        }
        else
        {
            query = query.Where(q =>
                q.Lesson.Course.LevelID == request.LevelID);
        }

        return query;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateExam([FromBody] GenerateExamRequestDTO request)
    {
        if (request.Parts == null || !request.Parts.Any())
            return BadRequest("Cấu trúc đề không được để trống.");

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
           try
            {
                await ValidateExamRequest(request);

                var lesson = await GetLessonIfNeeded(request);

                var targetSkill = ResolveTargetSkill(request);

                var exam = await CreateExamEntity(request, lesson, targetSkill);

                int currentOrder = 1;

                foreach (var part in request.Parts)
                {
                    currentOrder = await ProcessExamPart(
                        request,
                        exam,
                        part,
                        currentOrder
                    );
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = "Tạo đề thi thành công",
                    data = exam
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExamInfo(Guid id, [FromBody] UpdateExamRequestDTO request)
    {
        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamID == id);
                if (exam == null) return NotFound("Không tìm thấy đề thi.");
            
            // Chỉ kiểm tra nếu Title gửi lên khác với Title hiện tại của Exam
            if (!string.Equals(exam.Title, request.Title, StringComparison.OrdinalIgnoreCase))
            {
                var isTitleExisted = await _context.Exams
                    .AnyAsync(e => e.Title.ToLower() == request.Title.ToLower() && e.ExamID != id);

                if (isTitleExisted)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Tiêu đề này đã được sử dụng bởi một đề thi khác." 
                    });
                }
            }
                // 1. Cập nhật các trường cơ bản
                exam.Title = request.Title;
                exam.Duration = request.Duration;
                exam.PassingScore = request.PassingScore;
                exam.MinLanguageKnowledgeScore = request.MinLanguageKnowledgeScore;
                exam.MinReadingScore = request.MinReadingScore;
                exam.MinListeningScore = request.MinListeningScore;
                exam.ShowResultImmediately = request.ShowResultImmediately;
                exam.UpdatedAt = DateTime.UtcNow;

                // 2. KIỂM TRA NẾU ADMIN THAY ĐỔI CẤU TRÚC (PARTS)
                if (request.Parts != null && request.Parts.Any())
                {
                    // TĂNG VERSION - Đánh dấu đây là bộ câu hỏi mới
                    exam.Version += 1;
                    int newVersion = exam.Version;

                    // 3. BỐC CÂU HỎI MỚI CHO VERSION MỚI
                    int currentOrder = 1;
                    foreach (var part in request.Parts)
                    {
                        if (part.Quantity <= 0) continue;

                        var query = _context.Questions.AsQueryable();
                        
                        // Lọc câu hỏi 
                        query = query.Where(q => q.SkillType == part.SkillType);
                        if (exam.Type == ExamType.LessonPractice)
                            query = query.Where(q => q.LessonID == exam.LessonID);
                        else
                            query = query.Where(q => q.Lesson.Course.LevelID == exam.LevelID);

                        var selectedQuestions = await query
                            .OrderBy(q => Guid.NewGuid())
                            .Take(part.Quantity)
                            .ToListAsync();

                        if (selectedQuestions.Count < part.Quantity)
                            throw new Exception($"Không đủ câu hỏi cho phần {part.SkillType} ở Version mới.");

                        foreach (var q in selectedQuestions)
                        {
                            _context.Exam_Questions.Add(new Exam_Questions
                            {
                                ExamQuestionID = Guid.NewGuid(),
                                ExamID = id,
                                QuestionID = q.QuestionID,
                                Version = newVersion, 
                                OrderIndex = currentOrder++,
                                Score = part.PointPerQuestion,
                                ReadingID = q.ReadingID,
                                ListeningID = q.ListeningID
                            });
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { 
                    success = true, 
                    message = "Cập nhật thành công.", 
                    currentVersion = exam.Version 
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    private async Task<(int totalQuestions, decimal totalScore)> CalculateExamSummary(
        List<ExamPartConfigDTO> parts,
        Guid levelId,
        ExamType examType)
    {
        int totalQuestions = 0;
        decimal totalScore = 0;

        foreach (var part in parts)
        {
        // ====================================================================
        // NHÁNH 1: LOGIC CHO MOCK TEST (Tính toán chi tiết theo FORMAT)
        // ====================================================================
        if (examType == ExamType.MockTest) 
        {
            var query = _context.Questions
                .Where(q => q.SkillType == part.SkillType &&
                            q.QuestionFormat == part.QuestionFormat && // Khớp Format
                            q.Lesson.Course.LevelID == levelId);

            // Chỉ Group khi định dạng yêu cầu đọc bài dài (Passage)
            if (part.QuestionFormat == QuestionFormat.Passage)
            {
                if (part.SkillType == SkillType.Reading) query = query.Where(q => q.ReadingID != null);
                if (part.SkillType == SkillType.Listening) query = query.Where(q => q.ListeningID != null);

                var groups = await query.ToListAsync();
                var grouped = part.SkillType == SkillType.Reading
                    ? groups.GroupBy(q => q.ReadingID)
                    : groups.GroupBy(q => q.ListeningID);

                var selectedGroups = grouped.Take(part.Quantity).ToList();
                int realQuestionCount = selectedGroups.Sum(g => g.Count());

                totalQuestions += part.Quantity;
                totalScore += part.Quantity * part.PointPerQuestion;
            }
            else
            {
                // Các câu hỏi đơn lẻ (StandardChoice, StarSentence) tính tuyến tính
                totalQuestions += part.Quantity;
                totalScore += part.Quantity * part.PointPerQuestion;
            }
        }
        // ====================================================================
        // NHÁNH 2: LOGIC CHO PRACTICE (Giữ nguyên gốc theo SKILL TYPE)
        // ====================================================================
        else 
        {
            var query = _context.Questions
                .Where(q => q.SkillType == part.SkillType &&
                            q.Lesson.Course.LevelID == levelId);

            if (part.SkillType == SkillType.Reading) query = query.Where(q => q.ReadingID != null);
            if (part.SkillType == SkillType.Listening) query = query.Where(q => q.ListeningID != null);

            if (part.SkillType == SkillType.Reading || part.SkillType == SkillType.Listening)
            {
                // Giữ nguyên logic bốc Group nguyên bản của bạn để không làm lỗi Practice
                var groups = await query.ToListAsync();
                var grouped = part.SkillType == SkillType.Reading
                    ? groups.GroupBy(q => q.ReadingID)
                    : groups.GroupBy(q => q.ListeningID);

                var selectedGroups = grouped.Take(part.Quantity).ToList();
                int realQuestionCount = selectedGroups.Sum(g => g.Count());

                totalQuestions += realQuestionCount;
                totalScore += realQuestionCount * part.PointPerQuestion;
            }
            else
            {
                totalQuestions += part.Quantity;
                totalScore += part.Quantity * part.PointPerQuestion;
            }
        }
        }

        return (totalQuestions, totalScore);
    }

    [HttpPost("summary")]
    public  async Task<IActionResult> GetSummary(
        [FromBody] List<ExamPartConfigDTO> parts, 
        [FromQuery] Guid levelId, 
        [FromQuery] ExamType examType)
    {
        var result = await CalculateExamSummary(parts, levelId, examType);
        if (parts == null) return BadRequest();

        return Ok(new
    {
        TotalQuestions = result.totalQuestions,
        TotalScore = result.totalScore
    });
    }


    //Lấy danh sách khóa học để lọc
    [HttpGet("courses-by-level/{levelId}")]
    public async Task<IActionResult> GetCoursesByLevel(Guid levelId)
    {
        var courses = await _context.Courses
            .Where(c => c.LevelID == levelId)
            .Select(c => new { c.CourseID, c.CourseName })
            .ToListAsync();
        return Ok(courses);
    }

    //Lấy danh sách bài học (Có thể lọc theo Level hoặc sâu hơn là Course)
    [HttpGet("lessons-filter")]
    public async Task<IActionResult> GetFilteredLessons([FromQuery] Guid levelId, [FromQuery] Guid? courseId = null)
    {
        // Luôn bắt đầu lọc theo Level
        var query = _context.Lessons.Where(l => l.Course.LevelID == levelId);

        // Nếu người dùng chọn Course cụ thể thì lọc tiếp, nếu không thì lấy hết Lessons của Level đó
        if (courseId.HasValue && courseId.Value != Guid.Empty)
        {
            query = query.Where(l => l.CourseID == courseId.Value);
        }

       // Thực thi query và tính toán stats
        var lessons = await query
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.Title)
            .Select(l => new {
                l.LessonID,
                l.Title,
                // Đếm từ bảng Questions
               Questions = _context.Questions
                    .Where(q => q.LessonID == l.LessonID)
                    .Where(q =>
                        q.SkillType != SkillType.Reading &&
                        q.SkillType != SkillType.Listening)
                    .GroupBy(q => q.SkillType)
                    .Select(g => new
                    {
                        SkillId = (int)g.Key,
                        Count = g.Count()
                    })

                    .ToList(),

                // Đếm từ bảng Readings (SkillType.Reading = 4)
               ReadingCount = _context.Questions
                    .Where(q =>
                        q.LessonID == l.LessonID &&
                        q.ReadingID != null)
                    .Select(q => q.ReadingID)
                    .Distinct()
                    .Count(),

                // Đếm từ bảng Listenings (SkillType.Listening = 5)
                ListeningCount = _context.Questions
                    .Where(q =>
                        q.LessonID == l.LessonID &&
                        q.ListeningID != null)
                    .Select(q => q.ListeningID)
                    .Distinct()
                    .Count(),
            })
            .ToListAsync();

        // Mapping lại cấu trúc SkillStats để FE dễ dùng
        var result = lessons.Select(l => {
        // Khởi tạo list kiểu object để "đựng" được mọi thứ
        var stats = l.Questions.Select(q => (object)new {
            SkillId = q.SkillId,
            SkillName = Enum.GetName(typeof(SkillType), q.SkillId),
            TotalQuestions = q.Count
        }).ToList();

        
        if (l.ReadingCount > 0) {
            stats.Add(new { 
                SkillId = (int)SkillType.Reading, 
                SkillName = nameof(SkillType.Reading), 
                TotalQuestions = l.ReadingCount 
            });
        }

        if (l.ListeningCount > 0) {
            stats.Add(new { 
                SkillId = (int)SkillType.Listening, 
                SkillName = nameof(SkillType.Listening), 
                TotalQuestions = l.ListeningCount 
            });
        }

        return new {
            l.LessonID,
            l.Title,
            RawItemCount = l.Questions.Sum(q => q.Count) + l.ReadingCount + l.ListeningCount,
            SkillStats = stats 
        };
    });

    return Ok(result);
    
    }

    [HttpGet("stats-by-skill/{levelId}")]
    public async Task<IActionResult> GetStatsBySkill(Guid levelId)
    {
        var questions = await _context.Questions
        .Where(q => q.Lesson.Course.LevelID == levelId)
        .ToListAsync();

        var stats = questions
            .GroupBy(q => q.SkillType)
            .Select(g =>
            {
                int totalAvailable = 0;

                switch (g.Key)
                {
                    case SkillType.Reading:
                        totalAvailable = g
                            .Where(q => q.ReadingID != null)
                            .Select(q => q.ReadingID)
                            .Distinct()
                            .Count();
                        break;

                    case SkillType.Listening:
                        totalAvailable = g
                            .Where(q => q.ListeningID != null)
                            .Select(q => q.ListeningID)
                            .Distinct()
                            .Count();
                        break;

                    default:
                        totalAvailable = g.Count();
                        break;
                }

                return new
                {
                    SkillId = (int)g.Key,
                    SkillName = g.Key.ToString(),
                    TotalAvailable = totalAvailable
                };
            })
            .ToList();

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

        
        var result = await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExamListResponseDTO
            {
                ExamID = e.ExamID,
                Title = e.Title,
                LevelName = e.Level != null ? e.Level.LevelName : "N/A",
                Type = e.Type, 
                LessonTitle = e.Lesson != null ? e.Lesson.Title : null,
                
                
                TotalQuestions = e.ExamQuestions
                    .Where(q => q.Version == e.Version)
                    .Count(),

                
                TotalScore = Math.Round(
                    (double)e.ExamQuestions
                        .Where(q => q.Version == e.Version)
                    .Sum(q => q.Score), 2),

                Duration = e.Duration,
                CreatedAt = e.CreatedAt,
                IsPublished = e.IsPublished
            })
            .ToListAsync();
            
            return Ok(result);
    }
    
    
    [HttpGet("{id}/details")]
    public async Task<IActionResult> GetExamDetails(Guid id)
    {
        var exam = await _context.Exams
            .Include(e => e.Level)
            .Include(e => e.Course)
            .Include(e => e.ExamQuestions)
                .ThenInclude(eq => eq.Question)
            .FirstOrDefaultAsync(e => e.ExamID == id);

        if (exam == null) return NotFound("Không tìm thấy đề thi.");

        var currentVersionQuestions = exam.ExamQuestions
            .Where(eq => eq.Version == exam.Version) 
            .ToList();

       var questionGroups = currentVersionQuestions
            .Select(eq => new
            {
                eq.Question.SkillType,
                Score = Math.Round(eq.Score, 2)
            })
            .ToList()
            .GroupBy(x => new { x.SkillType, x.Score })
            .Select(g => new ExamPartConfigDTO
            {
                SkillType = g.Key.SkillType,
                Quantity = g.Count(),
                PointPerQuestion = g.Key.Score
            })
            .ToList();

        var details = new
        {
            exam.ExamID,
            exam.CourseID,

            CourseName = exam.Course?.CourseName,

            exam.Title,

            PassingScore = Math.Round(exam.PassingScore, 2),

            TotalScore = Math.Round(
                currentVersionQuestions.Sum(q => q.Score),
                2
            ),

            exam.Duration,
            ExamType = exam.Type,
            exam.LevelID,
            exam.LessonID,

            LevelName = exam.Level?.LevelName,

            LessonTitle = exam.Lesson?.Title,

            exam.ShowResultImmediately,
            exam.Version,

            MinScores = new
            {
                Language = Math.Round(exam.MinLanguageKnowledgeScore, 2),
                Reading = Math.Round(exam.MinReadingScore, 2),
                Listening = Math.Round(exam.MinListeningScore, 2)
            },

            Parts = questionGroups,

            Questions = await BuildQuestionTreeResponse(currentVersionQuestions)
        };

        return Ok(details);
    }


    private async Task<List<object>> BuildQuestionTreeResponse(
        List<Exam_Questions> examQuestions)
    {
        var result = new List<object>();

        // =========================
        // 1. QUESTION THƯỜNG
        // =========================
        var normalQuestions = examQuestions
            .Where(eq =>
                eq.ReadingID == null &&
                eq.ListeningID == null)
            .OrderBy(eq => eq.OrderIndex)
            .ToList();

        result.AddRange(
            normalQuestions.Select(eq => new
            {
                Type = "Normal",

                eq.QuestionID,
                eq.OrderIndex,

                Content = eq.Question.Content,

                SkillType = eq.Question.SkillType.ToString(),

                Score = eq.Score
            })
        );

        // =========================
        // 2. READING GROUP
        // =========================
        var readingGroups = examQuestions
            .Where(eq => eq.ReadingID != null)
            .GroupBy(eq => eq.ReadingID);

        foreach (var group in readingGroups)
        {
            var reading = await _context.Readings
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.ReadingID == group.Key);

            if (reading == null)
                continue;

            result.Add(new
            {
                Type = "Reading",

                ReadingID = reading.ReadingID,

                Content = reading.Content,

                SkillType = "Reading",

                SubQuestions = group
                    .OrderBy(x => x.OrderIndex)
                    .Select(eq => new
                    {
                        eq.QuestionID,
                        eq.OrderIndex,

                        Content = eq.Question.Content,

                        Score = eq.Score
                    })
                    .ToList()
            });
        }

        // =========================
        // 3. LISTENING GROUP
        // =========================
        var listeningGroups = examQuestions
            .Where(eq => eq.ListeningID != null)
            .GroupBy(eq => eq.ListeningID);

        foreach (var group in listeningGroups)
        {
            var listening = await _context.Listenings
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.ListeningID == group.Key);

            if (listening == null)
                continue;

            result.Add(new
            {
                Type = "Listening",

                ListeningID = listening.ListeningID,

                Content = listening.Title,

                AudioUrl = listening.AudioURL,

                SkillType = "Listening",

                SubQuestions = group
                    .OrderBy(x => x.OrderIndex)
                    .Select(eq => new
                    {
                        eq.QuestionID,
                        eq.OrderIndex,

                        Content = eq.Question.Content,

                        Score = eq.Score
                    })
                    .ToList()
            });
        }

        return result
            .OrderBy(x =>
            {
                var prop = x.GetType().GetProperty("OrderIndex");

                return prop != null
                    ? (int)prop.GetValue(x)!
                    : int.MaxValue;
            })
            .ToList<object>();
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



