using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/exam-sessions")]
    [Authorize]
    public class ExamSessionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        // private readonly IQuestionService _questionService;

        public ExamSessionsController(ApplicationDbContext context)
        {
            _context = context;
            
        }

        [HttpGet("{id}/session")]
        public async Task<IActionResult> GetOrCreateSession(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var exam = await _context.Exams
                .FirstOrDefaultAsync(x =>
                    x.ExamID == id &&
                    x.Type == ExamType.MockTest);

            if (exam == null)
                return NotFound();

            var session = await _context.Exam_Sessions
                .Include(x => x.Answers)
                .FirstOrDefaultAsync(x =>
                    x.UserID == userId &&
                    x.ExamID == id &&
                    x.Status == SessionStatus.InProgress);

            if (session == null)
            {
                var now = DateTime.UtcNow;
                session = new Exam_Sessions
                {
                    SessionID = Guid.NewGuid(),
                    UserID = userId,
                    ExamID = id,
                    RemainingTime = exam.Duration * 60,
                    Status = SessionStatus.InProgress,
                    StartedAt = now,
                    LastAccessedAt = now,
                    ExpiresAt = now.AddMinutes(exam.Duration),
                    ExamVersion = exam.Version
                };

                _context.Exam_Sessions.Add(session);

                await _context.SaveChangesAsync();
            }
            var noww = DateTime.UtcNow;
           var remainingSeconds = Math.Max(0, (int)(session.ExpiresAt - DateTime.UtcNow) .TotalSeconds);
        //    Console.WriteLine($"NOW: {noww}");
        // Console.WriteLine($"EXPIRES: {session.ExpiresAt}");
        // Console.WriteLine($"REMAINING: {remainingSeconds}");

           session.LastAccessedAt = DateTime.UtcNow;

           if (remainingSeconds <= 0 && session.Status == SessionStatus.InProgress) 
           { 
            session.Status = SessionStatus.Submitted; 

            await _context.SaveChangesAsync(); 
            }

           var examQuestions = await _context.Exam_Questions
                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Answers)

                .Include(eq => eq.Question)
                    .ThenInclude(q => q.SubQuestions)
                        .ThenInclude(sq => sq.Answers)

                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Reading)

                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Listening)

                .Where(eq =>
                    eq.ExamID == id &&
                    eq.Version == exam.Version)
                .OrderBy(eq => eq.OrderIndex)
                .ToListAsync();

            var tree =
                await BuildExamQuestionTreeV2(examQuestions);

            return Ok(new
            {
                SessionID = session.SessionID,

                Title = exam.Title,
                Duration = exam.Duration,
                Version = exam.Version,
                RemainingTime = remainingSeconds,
                Status = session.Status,

                Answers = session.Answers.Select(a => new
                {
                    a.QuestionID,
                    a.SelectedAnswerID,
                    a.TextAnswer,
                    a.ResponseTime
                }),

                Exam = tree
            });
        }
        private async Task<List<ExamTreeItemDTO>> BuildExamQuestionTreeV2(
        List<Exam_Questions> examQuestions)
        {
        var result = new List<ExamTreeItemDTO>();

            // =========================
            // 1. NORMAL QUESTIONS (Grammar/Vocab/Kanji)
            // =========================
            var normalQuestions = examQuestions
                .Where(x =>
                    x.ReadingID == null &&
                    x.ListeningID == null)
                .OrderBy(x => x.OrderIndex)
                .ToList();

            result.AddRange(
                normalQuestions.Select(x => new ExamTreeItemDTO
                {
                    Type = "Normal",

                    QuestionID = x.Question!.QuestionID,

                    SkillType = x.Question.SkillType.ToString(),

                    Content = x.Question.Content,

                    OrderIndex = x.OrderIndex,

                    Score = x.Score,

                    ImageURL = x.Question.ImageURL,

                    Options = x.Question.Answers
                        .Select(a => new AnswerOptionDTO
                        {
                            AnswerID = a.AnswerID,
                            AnswerText = a.AnswerText
                        })
                        .ToList()
                })
            );

            // =========================
            // 2. READING (PARENT → CHILD)
            // =========================
            var readingGroups = examQuestions
                .Where(x => x.ReadingID != null)
                .GroupBy(x => x.ReadingID);

            foreach (var group in readingGroups)
            {
                var reading = await _context.Readings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.ReadingID == group.Key);

                if (reading == null) continue;

                var ordered = group.OrderBy(x => x.OrderIndex).ToList();

            result.Add(new ExamTreeItemDTO
                {
                    Type = "Reading",

                    SkillType = "Reading",

                    Content = reading.Content,

                    SubQuestions = ordered.Select(x =>
                        new QuestionDisplayDTO
                        {
                            QuestionID = x.Question!.QuestionID,

                            Content = x.Question.Content,

                            DisplayOrder = x.OrderIndex,

                            ImageURL = x.Question.ImageURL,

                            Options = x.Question.Answers
                                .OrderBy(a => a.AnswerText)
                                .Select(a => new AnswerOptionDTO
                                {
                                    AnswerID = a.AnswerID,
                                    AnswerText = a.AnswerText
                                })
                                .ToList()
                        }).ToList()
                });
            }

            // =========================
            // 3. LISTENING (PARENT → CHILD)
            // =========================
            var listeningGroups = examQuestions
                .Where(x => x.ListeningID != null)
                .GroupBy(x => x.ListeningID);

            foreach (var group in listeningGroups)
            {
                var listening = await _context.Listenings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.ListeningID == group.Key);

                if (listening == null) continue;

                var ordered = group.OrderBy(x => x.OrderIndex).ToList();

                result.Add(new ExamTreeItemDTO
                {
                    Type = "Listening",

                    SkillType = "Listening",

                    Content = listening.Title,

                    AudioUrl = listening.AudioURL,

                    Script = listening.Script,

                    SubQuestions = ordered.Select(x =>
                        new QuestionDisplayDTO
                        {
                            QuestionID = x.Question!.QuestionID,

                            Content = x.Question.Content,

                            DisplayOrder = x.OrderIndex,

                            ImageURL = x.Question.ImageURL,

                            Options = x.Question.Answers
                                .OrderBy(a => a.AnswerText)
                                .Select(a => new AnswerOptionDTO
                                {
                                    AnswerID = a.AnswerID,
                                    AnswerText = a.AnswerText
                                })
                                .ToList()
                        }).ToList()
                });
            }

            // =========================
            // FINAL SORT (IMPORTANT)
            // =========================
            return result
                .OrderBy(x =>
                {
                    var skill = x.GetType().GetProperty("SkillType")?.GetValue(x)?.ToString();

                    return skill switch
                    {
                        "Grammar" => 1,
                        "Vocabulary" => 2,
                        "Kanji" => 3,
                        "Reading" => 4,
                        "Listening" => 5,
                        _ => 99
                    };
                })
                .ToList();
        }

        [HttpPost("session/save")]
        public async Task<IActionResult> SaveProgress(
        [FromBody] SaveExamProgressDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var session = await _context.Exam_Sessions
                .FirstOrDefaultAsync(x =>
                    x.SessionID == dto.SessionID &&
                    x.UserID == userId);

            if (session == null)
                return NotFound();

            if (session.Status != SessionStatus.InProgress)
                return BadRequest("Session đã submit.");

            if (DateTime.UtcNow > session.ExpiresAt)
            {
                session.Status = SessionStatus.Submitted;

                await _context.SaveChangesAsync();

                return BadRequest("Đã hết thời gian làm bài.");
            }

            foreach (var ans in dto.Answers)
            {
                var existing = await _context.Exam_Session_Answers
                    .FirstOrDefaultAsync(x =>
                        x.SessionID == session.SessionID &&
                        x.QuestionID == ans.QuestionID);

                if (existing == null)
                {
                    _context.Exam_Session_Answers.Add(new Exam_Session_Answers
                    {
                        SessionAnswerID = Guid.NewGuid(),
                        SessionID = session.SessionID,

                        QuestionID = ans.QuestionID,

                        SelectedAnswerID = ans.SelectedAnswerID,

                        TextAnswer = ans.TextAnswer,

                        ResponseTime = ans.ResponseTime,

                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    existing.SelectedAnswerID = ans.SelectedAnswerID;

                    existing.TextAnswer = ans.TextAnswer;

                    existing.ResponseTime = ans.ResponseTime;

                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }
            
            session.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã lưu tiến trình."
            });
        }
        
        [HttpDelete("session/{sessionId}")]
        public async Task<IActionResult> ResetSession(Guid sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var session = await _context.Exam_Sessions
                .Include(x => x.Answers)
                .FirstOrDefaultAsync(x =>
                    x.SessionID == sessionId &&
                    x.UserID == userId);

            if (session == null)
                return NotFound();

            _context.Exam_Session_Answers
                .RemoveRange(session.Answers);

            _context.Exam_Sessions
                .Remove(session);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã reset bài thi."
            });
        }
    [HttpGet("{id}/active-session")]
    public async Task<IActionResult> GetActiveSession(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var session = await _context.Exam_Sessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.UserID == userId &&
                x.ExamID == id &&
                x.Status == SessionStatus.InProgress);

        if (session == null)
        {
            return Ok(new
            {
                HasSession = false,
                SessionID = (Guid?)null
            });
        }

        return Ok(new
        {
            HasSession = true,
            SessionID = session.SessionID
        });
    }
    
    }
}