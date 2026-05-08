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
    
    
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateExam([FromBody] GenerateExamRequestDTO request)
    {
        if (request.Parts == null || !request.Parts.Any())
            return BadRequest("Cấu trúc đề không được để trống.");

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {

                var lesson = await _context.Lessons
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.LessonID == request.LessonID);

                if (lesson == null && request.Type == ExamType.LessonPractice)
                    return BadRequest("Không tìm thấy bài học tương ứng.");

                //kiểm tra xem tiêu đề EXAMTYPE = SKILLPRACTICE đã tồn tại chưa để tránh trùng lặp  
                var isTitleExisted = await _context.Exams
                .AnyAsync(e => e.Title.ToLower() == request.Title.ToLower());
            
                if (isTitleExisted)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = $"Tiêu đề đề thi '{request.Title}' đã tồn tại. Vui lòng chọn tên khác." 
                    });
                }

                // Kiểm tra nếu là bài luyện tập theo bài học thì không được phép tạo thêm nếu đã tồn tại
                if (request.Type == ExamType.LessonPractice && request.LessonID.HasValue)
                {
                    var isExisted = await _context.Exams
                        .AnyAsync(e => e.LessonID == request.LessonID && e.Type == ExamType.LessonPractice);

                    if (isExisted)
                    {
                        return BadRequest(new { 
                            success = false, 
                            message = "Bài học này đã có bài luyện tập. Không thể tạo thêm đề mới." 
                        });
                    }
                }

                SkillType? targetSkill = null; 

                if (request.Type == ExamType.SkillPractice && request.Parts != null && request.Parts.Any())
                {
                    targetSkill = (SkillType)request.Parts.First().SkillType;
                }

                // Bước 1: Tạo bản ghi Exams
                var exam = new Exams
                {
                    ExamID = Guid.NewGuid(),
                    TemplateID = request.TemplateID,
                    Title = request.Title,
                    Duration = request.Duration,
                    LevelID = request.LevelID,

                    //ExamType
                    Type = request.Type, 
                    //SkillType
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

                int currentOrder = 1;

                Guid? detectedCourseId = null;
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
                        .Include(q => q.Lesson) // Thêm Include để lấy thông tin Lesson để gán cho TH ExamType = 2
                        .OrderBy(q => Guid.NewGuid()) 
                        .Take(part.Quantity)
                        .ToListAsync();


                    if (detectedCourseId == null && selectedQuestions.Any())
                        {
                            detectedCourseId = selectedQuestions.First().Lesson.CourseID;
                        }

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
                            ReadingID = q.ReadingID,
                            ListeningID = q.ListeningID,
                            Score = part.PointPerQuestion ,
                            Version = 1
                        };
                        _context.Exam_Questions.Add(examQuestion);
                    }
                }
                    exam.CourseID = exam.CourseID ?? detectedCourseId;
            
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true,
                                message = "Tạo đề thi thành công",
                                data = exam });
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

    // [HttpGet("lessons-by-level/{levelId}")]
    // public async Task<IActionResult> GetLessonsByLevel(Guid levelId)
    // {
    //     var lessons = await _context.Lessons
    //         .Where(l => l.Course.LevelID == levelId)
    //         .OrderBy(l => l.Title)
    //         .Select(l => new {
    //             l.LessonID,
    //             l.Title,
    //             RawQuestionCount = _context.Questions.Count(q => q.LessonID == l.LessonID), 
    //             SkillStats = _context.Questions
    //                 .Where(q => q.LessonID == l.LessonID)
    //                 .GroupBy(q => q.SkillType)
    //                 .Select(g => new {
    //                     SkillId = (int)g.Key,
    //                     SkillName = g.Key.ToString(),
    //                     TotalQuestions = g.Count()
    //                 }).ToList()
    //         })
    //         .ToListAsync();

    //     return Ok(lessons);
    // }

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
        // 1. Luôn bắt đầu lọc theo Level
        var query = _context.Lessons.Where(l => l.Course.LevelID == levelId);

        // 2. Nếu người dùng chọn Course cụ thể thì lọc tiếp, nếu không thì lấy hết Lessons của Level đó
        if (courseId.HasValue && courseId.Value != Guid.Empty)
        {
            query = query.Where(l => l.CourseID == courseId.Value);
        }

       // 2. Thực thi query và tính toán stats
        var lessons = await query
            .OrderBy(l => l.Title)
            .Select(l => new {
                l.LessonID,
                l.Title,
                // Đếm từ bảng Questions
                Questions = _context.Questions
                    .Where(q => q.LessonID == l.LessonID)
                    .GroupBy(q => q.SkillType)
                    .Select(g => new { SkillId = (int)g.Key, Count = g.Count() }).ToList(),

                // Đếm từ bảng Readings (SkillType.Reading = 4)
                ReadingCount = _context.Readings.Count(r => r.LessonID == l.LessonID),

                // Đếm từ bảng Listenings (SkillType.Listening = 5)
                ListeningCount = _context.Listenings.Count(li => li.LessonID == l.LessonID)
            })
            .ToListAsync();

        // 3. Mapping lại cấu trúc SkillStats để FE dễ dùng
        var result = lessons.Select(l => {
        // 1. Khởi tạo list kiểu object để "đựng" được mọi thứ
        var stats = l.Questions.Select(q => (object)new {
            SkillId = q.SkillId,
            SkillName = Enum.GetName(typeof(SkillType), q.SkillId),
            TotalQuestions = q.Count
        }).ToList();

        // 2. Bây giờ dòng Add này sẽ KHÔNG bị gạch vàng nữa
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

                    
                    TotalScore = (double)e.ExamQuestions
                        .Where(q => q.Version == e.Version)
                        .Sum(q => q.Score),

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
                .Select(eq => new { eq.Question.SkillType, eq.Score })
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
                exam.PassingScore,
                exam.Duration,
                ExamType = exam.Type,
                exam.LevelID,
                exam.LessonID,
                LevelName = exam.Level != null ? exam.Level.LevelName : null,
                LessonTitle = exam.Lesson != null ? exam.Lesson.Title : null,
                exam.ShowResultImmediately,
                exam.Version,
                MinScores = new {
                    Language = exam.MinLanguageKnowledgeScore,
                    Reading = exam.MinReadingScore,
                    Listening = exam.MinListeningScore
                },
                Parts = questionGroups,
                // Danh sách câu hỏi 
                Questions = currentVersionQuestions
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



