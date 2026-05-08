using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Services.Learners;
using QuizzTiengNhat.Models.Enums;
namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/skill-practice")]
    [Authorize(Roles = "Learner")]
    public class SkillPraciceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IQuestionService _questionService;

        public SkillPraciceController(ApplicationDbContext context, IQuestionService questionService)
        {
            _context = context;
            _questionService = questionService;
        }

        private string RequireUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("Missing userId in token.");
            return userId;
        }

        [HttpGet("questions-by-filter")]
        public async Task<IActionResult> GetQuestions([FromQuery] SkillPracticeDTO filter)
        {
            try
            {
                // Đảm bảo limit không quá lớn gây sập server
                if (filter.Limit > 50) filter.Limit = 50;

                var questions = await _questionService.GetQuestionsByFilterAsync(filter);

                if (questions == null || !questions.Any())
                    return NotFound("Không tìm thấy câu hỏi nào phù hợp với bộ lọc.");

                return Ok(questions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách câu hỏi", detail = ex.Message });
            }
        }

        [HttpGet("skill-hub")]
        public async Task<IActionResult> GetSkillHub()
        {
            try
            {
                var userId = RequireUserId();

                var skillMatrix = await _context.User_Skill_Matrices.AsNoTracking()
                    .Where(s => s.UserID == userId)
                    .GroupBy(s => s.SkillType)
                    .Select(g => new
                    {
                        SkillType = g.Key,
                        CurrentProficiency = g.Max(x => x.ProficiencyScore),
                        NeedsReview = g.Any(x => x.NeedsReview)
                    })
                    .ToListAsync();

                var skillSummary = skillMatrix.ToDictionary(
                    x => x.SkillType,
                    x => new { x.CurrentProficiency, x.NeedsReview });

                var examBestScores = await _context.Exam_Results.AsNoTracking()
                    .Where(r => r.UserID == userId)
                    .GroupBy(r => r.ExamID)
                    .Select(g => new { ExamID = g.Key, BestScore = g.Max(r => r.Score) })
                    .ToDictionaryAsync(x => x.ExamID, x => x.BestScore);

                var exams = await _context.Exams.AsNoTracking()
                    .Where(e => e.TargetSkill != null && e.IsPublished)
                    .Select(e => new
                    {
                        e.ExamID,
                        e.Title,
                        e.SortOrder,
                        e.IsCheckpoint,
                        e.TargetSkill,
                        e.CourseID,
                        CourseName = e.Course == null ? null : e.Course.CourseName,
                        e.LessonID,
                        e.LevelID
                    })
                    .ToListAsync();

                var groups = exams
                    .Where(e => e.TargetSkill.HasValue)
                    .GroupBy(e => e.TargetSkill!.Value)
                    .Select(g => new SkillHubGroupDTO
                    {
                        SkillType = g.Key,
                        SkillName = Enum.GetName(typeof(SkillType), g.Key) ?? g.Key.ToString(),
                        CurrentProficiency = skillSummary.TryGetValue(g.Key, out var summary) ? summary.CurrentProficiency : 0,
                        NeedsReview = skillSummary.TryGetValue(g.Key, out var summary2) ? summary2.NeedsReview : false,
                        Items = g.Select(exam => new SkillHubItemDTO
                        {
                            ExamID = exam.ExamID,
                            Title = exam.Title,
                            CourseID = exam.CourseID,
                            CourseName = exam.CourseName,
                            LessonID = exam.LessonID,
                            SortOrder = exam.SortOrder,
                            IsCheckpoint = exam.IsCheckpoint,
                            IsPublished = true,
                            BestScore = examBestScores.TryGetValue(exam.ExamID, out var score) ? score : null,
                            LevelID = exam.LevelID
                        })
                        .OrderBy(item => item.SortOrder)
                        .ToList()
                    })
                    .OrderBy(g => g.SkillType)
                    .ToList();

                return Ok(groups);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy Skill Hub", detail = ex.Message });
            }
        }

        [HttpGet("metadata/radicals")]
        public async Task<IActionResult> GetRadicals()
        {
            var radicals = await _context.Radicals
                .Include(r => r.RadicalVariants) // Lấy kèm biến thể
                .OrderBy(r => r.StrokeCount)
                .Select(r => new {
                    id = r.RadicalID,
                    // Hiển thị tên kèm các biến thể nếu có
                    name = r.Name + (r.RadicalVariants.Any()
                        ? " [" + string.Join(", ", r.RadicalVariants.Select(v => v.Character)) + "]"
                        : ""),
                    character = r.Character,
                    stroke = r.StrokeCount
                })
                .ToListAsync();
            return Ok(radicals);
        }

        [HttpGet("metadata/word-types")]
        public async Task<IActionResult> GetWordTypes() => Ok(await _context.WordTypes.Select(w => new { id = w.WordTypeID, name = w.Name }).ToListAsync());

        [HttpGet("metadata/grammar-groups")]
        public async Task<IActionResult> GetGrammarGroups() =>
            Ok(await _context.GrammarGroups.Select(gg => new { id = gg.GrammarGroupID, name = gg.GroupName }).ToListAsync());

        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() => Ok(await _context.JLPT_Levels.Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() => Ok(await _context.Topics.Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons() => Ok(await _context.Lessons.Select(l => new { id = l.LessonID, name = l.Title }).ToListAsync());


        [HttpGet]
        public async Task<IActionResult> GetSkillPracticeExams([FromQuery] int? skillType) 
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId)) return Unauthorized();
                
                //Xác định trình độ của User để trả về bài tập phù hợp
                var user = await _context.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);
                if (user?.LevelID == null) return BadRequest(new { message = "User level not found." });

                var query = _context.Exams.AsNoTracking()
                .Where(e => e.Type == ExamType.SkillPractice && e.LevelID == user.LevelID);

                //CHỈ LỌC THEO SKILL NẾU CÓ TRUYỀN THAM SỐ
                if (skillType.HasValue)
                {
                    query = query.Where(e => (int)e.TargetSkill == skillType.Value);
                }

                //Lấy danh sách Exams theo Type = 2 và đúng Skill + Trình độ
                var exams = await query
                    .Select(e => new
                    {
                        e.ExamID,
                        e.Title,              
                        e.Duration,
                        e.PassingScore,
                        e.Version,
                        e.TargetSkill
                    })
                    .ToListAsync();

                //Lấy kết quả tốt nhất của User cho các bài thi này
                var examIds = exams.Select(e => e.ExamID).ToList();
                var userResults = await _context.Exam_Results.AsNoTracking()
                    .Where(r => r.UserID == userId && examIds.Contains(r.ExamID))
                    .ToListAsync();

                // Map dữ liệu trả về
                var result = exams.Select(e => {
                    // Lấy kết quả mới nhất để check Version
                    var latestRes = userResults
                        .Where(r => r.ExamID == e.ExamID)
                        .OrderByDescending(r => r.CreatedAt)
                        .FirstOrDefault();

                    // Lấy điểm cao nhất
                    var bestScore = userResults
                        .Where(r => r.ExamID == e.ExamID)
                        .Max(r => (double?)r.Score) ?? 0;

                    return new {
                        e.ExamID,
                        e.Title,
                        e.Duration,
                        e.TargetSkill,
                        BestScore = bestScore,
                        IsCompleted = userResults.Any(r => r.ExamID == e.ExamID && r.Score >= (double)e.PassingScore),
                        HasNewVersion = latestRes != null && e.Version > latestRes.ExamVersion,
                        LatestResultID = latestRes?.ResultID
                    };
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
