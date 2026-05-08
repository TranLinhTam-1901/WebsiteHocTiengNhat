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
    [Route("api/learner/exams")]
    [Authorize]
public class LearnerExamController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    // private readonly IQuestionService _questionService;

    public LearnerExamController(ApplicationDbContext context)
    {
        _context = context;
        
    }

    [HttpGet("results/{resultId}")]
    public async Task<IActionResult> GetExamResult([FromRoute] Guid resultId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _context.Exam_Results
            .AsNoTracking()
            .Include(r => r.Exam)
            .Include(r => r.ResultDetails) // Giữ lại logic lấy chi tiết bài làm của bạn
            .FirstOrDefaultAsync(r => r.ResultID == resultId && r.UserID == userId);

        if (result == null) return NotFound(new { message = "Result not found." });

        var exam = result.Exam;
        if (exam == null) return BadRequest(new { message = "Exam not found for this result." });

        var examQuestions = await _context.Exam_Questions
            .AsNoTracking()
            .Include(eq => eq.Question)
                .ThenInclude(q => q.Answers)
            .Where(eq => eq.ExamID == result.ExamID && eq.Version == result.ExamVersion) // Dùng Version của kết quả
            .OrderBy(eq => eq.OrderIndex)
            .ToListAsync();
        //Gán ngược lại vào object result để các logic xử lý bên dưới của bạn không bị lỗi Reference
        result.Exam.ExamQuestions = examQuestions;  
        
        var questionIds = examQuestions.Select(eq => eq.Question!.QuestionID).Distinct().ToList();

        // Heuristic lấy đáp án user đã chọn từ UserAnswerHistories (do Exam_Result_Details không lưu SelectedAnswer)
        // Lấy bản ghi gần thời điểm nộp bài nhất theo từng QuestionID.
        var from = result.CreatedAt.AddMinutes(-30);
        var to = result.CreatedAt.AddMinutes(10);

        var histories = await _context.UserAnswerHistories
            .AsNoTracking()
            .Where(h => h.UserID == userId
                        && questionIds.Contains(h.QuestionID)
                        && h.AnsweredAt >= from
                        && h.AnsweredAt <= to)
            .OrderByDescending(h => h.AnsweredAt)
            .ToListAsync();

        var historyMap = histories
            .GroupBy(h => h.QuestionID)
            .ToDictionary(g => g.Key, g => g.First());

        var detailMap = result.ResultDetails
            .GroupBy(d => d.QuestionID)
            .ToDictionary(g => g.Key, g => g.First());

        var reviewQuestions = examQuestions.Select(eq =>
        {
            var q = eq.Question!;
            detailMap.TryGetValue(q.QuestionID, out var d);
            historyMap.TryGetValue(q.QuestionID, out var h);

            var correctAnswer = q.Answers.FirstOrDefault(a => a.IsCorrect);
            Guid? selectedAnswerId = h?.SelectedAnswerID;
            var selectedAnswer = selectedAnswerId.HasValue
                ? q.Answers.FirstOrDefault(a => a.AnswerID == selectedAnswerId.Value)
                : null;

            return new ExamReviewQuestionDTO
            {
                QuestionID = q.QuestionID,
                Content = q.Content,
                IsCorrect = d?.IsCorrect ?? false,
                ResponseTime = d?.ResponseTime ?? 0,
                SelectedAnswerID = h?.SelectedAnswerID,
                SelectedAnswerText = selectedAnswer?.AnswerText ?? h?.TextAnswer,
                CorrectAnswerID = correctAnswer?.AnswerID,
                CorrectAnswerText = correctAnswer?.AnswerText
            };
        }).ToList();

        var response = new SubmitExamResultDTO
        {
            ResultID = result.ResultID,
            ExamID = exam.ExamID,
            ExamTitle = exam.Title,
            ExamDuration = exam.Duration,
            Score = result.Score,
            CorrectAnswers = result.ResultDetails.Count(d => d.IsCorrect),
            TotalQuestions = examQuestions.Count,
            TimeSpent = result.TimeSpent,
            Questions = reviewQuestions
        };

        return Ok(response);
    }

   [HttpGet("{id}/questions")]
    public async Task<IActionResult> GetExamQuestions(Guid id)
    {
        // 1. Tải dữ liệu với các liên kết chính xác theo Model
        var exam = await _context.Exams
            .Include(e => e.ExamQuestions.OrderBy(eq => eq.OrderIndex))
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Answers)
            .Include(e => e.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.SubQuestions) // Tải thêm câu hỏi con
                        .ThenInclude(sq => sq.Answers)
            .Include(e => e.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Reading) // Liên kết bài đọc
            .FirstOrDefaultAsync(e => e.ExamID == id);

        if (exam == null) return NotFound("Đề thi không tồn tại.");

        // 2. Lọc và ánh xạ dữ liệu
        var response = new ExamDisplayDTO
        {
            ExamID = exam.ExamID,
            Title = exam.Title,
            Duration = exam.Duration,
            Version = exam.Version, // Lấy version của đề thi
            Questions = exam.ExamQuestions
                .Where(eq => eq.Question != null 
                            && eq.Question.ParentID == null // Chỉ lấy câu hỏi gốc/cha
                            && eq.Question.Status == Status.Published
                            && eq.Version == exam.Version) 
                .Select(eq => new QuestionDisplayDTO 
                {
                    QuestionID = eq.Question.QuestionID,
                    Content = eq.Question.Content,
                    QuestionType = eq.Question.QuestionType,
                    ReadingContent = eq.Question.Reading?.Content, // Lấy nội dung bài đọc nếu có
                    AudioURL = eq.Question.AudioURL,
                    // Ánh xạ danh sách đáp án
                    Options = eq.Question.Answers.Select(a => new AnswerOptionDTO {
                        AnswerID = a.AnswerID,
                        AnswerText = a.AnswerText
                    }).ToList(),
                    // Ánh xạ câu hỏi con (SubQuestions)
                    SubQuestions = eq.Question.SubQuestions
                        .OrderBy(sq => sq.DisplayOrder)
                        .Select(sq => new SubQuestionDTO {
                            QuestionID = sq.QuestionID,
                            Content = sq.Content,
                            Options = sq.Answers.Select(sa => new AnswerOptionDTO {
                                AnswerID = sa.AnswerID,
                                AnswerText = sa.AnswerText
                            }).ToList()
                        }).ToList()
                })
                .ToList()
        };

        return Ok(response);
    }

    private async Task UpdateUserSkillMatrix(string userId, List<Exam_Result_Details> details,Guid? levelId )
    {
        // Lọc bỏ những bản ghi có SkillType null trước khi group để tránh lỗi Nullable
        var skillGroups = details
            .Where(d => d.SkillType.HasValue) 
            .GroupBy(d => d.SkillType.Value);

        foreach (var group in skillGroups)
        {
            var skillType = group.Key;
            var correctInSkill = group.Count(d => d.IsCorrect);
            var totalInSkill = group.Count();
            
            // Tính toán performance
            float performance = (float)correctInSkill / totalInSkill * 100;

            var matrix = await _context.User_Skill_Matrices
                .FirstOrDefaultAsync(m => m.UserID == userId 
                                    && m.SkillType == skillType
                                    );

            if (matrix == null)
            {
                // Tính toán nhanh chỉ số tự tin ban đầu cho lần đầu tiên
                double avgResponseTime = group.Average(d => d.ResponseTime);
                float timeWeight = avgResponseTime <= 30000 ? 1.0f : Math.Max(0.5f, 1.0f - (float)(avgResponseTime - 30000) / 60000);
                
                // Nếu lần đầu làm tốt (>80%), cho ngay 50% tự tin, nếu kém thì cho 20%
                int initialConfidence = performance >= 80 ? (int)(50 * timeWeight) : 20;
                _context.User_Skill_Matrices.Add(new User_Skill_Matrix
                {
                    UserID = userId,
                    SkillType = skillType,
                    LevelID = levelId,
                    Confidence = initialConfidence,
                    NeedsReview = initialConfidence < 40,
                    // Ép kiểu float về int bằng cách làm tròn (Math.Round)
                    ProficiencyScore = (int)Math.Round(performance), 
                    LastUpdated = DateTime.UtcNow
                });
            }
            else
            {
                
                // 1. Tính toán hiệu suất bài thi hiện tại (0-100)
                float currentPerformance = (float)correctInSkill / totalInSkill * 100;

                // 2. Tính toán trọng số thời gian (Time Weight)
                // Giả sử thời gian trung bình lý tưởng cho 1 câu là 30s (30000ms)
                // Nếu ResponseTime trung bình nhỏ hơn hoặc bằng 30s, trọng số là 1.0. Nếu quá lâu thì giảm dần.
                double avgResponseTime = group.Average(d => d.ResponseTime);
                float timeWeight = avgResponseTime <= 30000 ? 1.0f : Math.Max(0.5f, 1.0f - (float)(avgResponseTime - 30000) / 60000);

                // 3. Cập nhật ProficiencyScore (Dùng công thức Exponential Moving Average để mượt mà hơn)
                // Score mới = (Score cũ * 0.7) + (Performance mới * 0.3)
                matrix.ProficiencyScore = (int)Math.Round((matrix.ProficiencyScore * 0.7) + (currentPerformance * 0.3));

                // 4. Tính toán Confidence mới
                // Nếu làm đúng và nhanh -> Tăng Confidence
                // Nếu làm sai -> Giảm Confidence mạnh để AI bắt học lại sớm
                float confidenceDelta;
                if (currentPerformance >= 80) 
                    confidenceDelta = 5 * timeWeight; // Tăng tối đa 5 điểm tự tin
                else if (currentPerformance < 50)
                    confidenceDelta = -10; // Sai nhiều thì trừ mạnh 10 điểm tự tin
                else
                    confidenceDelta = -2; // Trung bình thì giảm nhẹ để thử thách thêm

                matrix.Confidence = Math.Clamp(matrix.Confidence + (int)confidenceDelta, 0, 100);
                
                matrix.LastUpdated = DateTime.UtcNow;
                matrix.NeedsReview = matrix.Confidence < 40;

                if (matrix.LevelID == null) matrix.LevelID = levelId;
            }
        }
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitExam(Guid id, [FromBody] SubmitExamRequestDTO request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var exam = await _context.Exams
            .Include(e => e.Template)
            .Include(e => e.ExamQuestions)
            .ThenInclude(eq => eq.Question)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(e => e.ExamID == id);

        if (exam == null) return NotFound();

        var currentVersionQuestions = exam.ExamQuestions
                .Where(eq => eq.Version == exam.Version && eq.Question != null)
                .ToList();
                
        int correctCount = 0;
        var resultDetails = new List<Exam_Result_Details>();
        var answerMap = request.Answers
            .GroupBy(a => a.QuestionID)
            .ToDictionary(g => g.Key, g => g.Last());

        foreach (var userAns in request.Answers)
        {
            var question = currentVersionQuestions
                            .Select(eq => eq.Question)
                            .FirstOrDefault(q => q.QuestionID == userAns.QuestionID);
            
            if (question == null) continue;

            var correctAnswer = question.Answers.FirstOrDefault(a => a.IsCorrect);
            bool isCorrect = false;

            // Logic chấm điểm (Trắc nghiệm & Tự luận)
            if (userAns.SelectedAnswerID.HasValue)
                isCorrect = (userAns.SelectedAnswerID == correctAnswer?.AnswerID);
            else if (!string.IsNullOrEmpty(userAns.TextAnswer))
                isCorrect = correctAnswer?.AnswerText.Trim().Equals(userAns.TextAnswer.Trim(), StringComparison.OrdinalIgnoreCase) ?? false;

            if (isCorrect) correctCount++;

            // Chuẩn bị dữ liệu chi tiết
            resultDetails.Add(new Exam_Result_Details
            {
                ResultDetailID = Guid.NewGuid(),
                QuestionID = question.QuestionID,
                IsCorrect = isCorrect,
                ResponseTime = userAns.ResponseTime,
                SkillType = question.SkillType
            });

            // Ghi vào lịch sử làm bài để AI/Flashcard sử dụng
            _context.UserAnswerHistories.Add(new UserAnswerHistory
            {
                HistoryID = Guid.NewGuid(),
                UserID = userId,
                QuestionID = question.QuestionID,
                SelectedAnswerID = userAns.SelectedAnswerID,
                TextAnswer = userAns.TextAnswer,
                IsCorrect = isCorrect,
                TimeTaken = userAns.ResponseTime
            });
        }

        // Tính tổng điểm
       float finalScore = 0;
       bool isMockTest = exam.TemplateID != null && exam.Template?.TotalMaxScore == 180;

       if (isMockTest) 
        {
            // TRƯỜNG HỢP MOCKTEST (Type 0): Tính theo trọng số từ TemplateDetails
            var templateDetails = await _context.ExamTemplateDetails
                .Where(td => td.TemplateID == exam.TemplateID)
                .ToListAsync();

            decimal totalWeightedScore = 0;

            foreach (var detail in resultDetails.Where(d => d.IsCorrect))
            {
                // Lấy điểm mỗi câu dựa trên SkillType của câu hỏi đó
                var pointRule = templateDetails.FirstOrDefault(td => td.SkillType == detail.SkillType);
                if (pointRule != null)
                {
                    totalWeightedScore += pointRule.PointPerQuestion;
                }
            }
            finalScore = (float)totalWeightedScore; 
        }
        else 
        {
            // TRƯỜNG HỢP LUYỆN TẬP: Tính thang điểm 10 (Mặc định cho bài tập lẻ)

            finalScore = currentVersionQuestions.Count > 0 
                ? (float)correctCount / currentVersionQuestions.Count * 10 
                : 0;
        }
        
        var currentVersion = exam.Version;

        var examResult = new Exam_Results
        {
            ResultID = Guid.NewGuid(),
            ExamID = id,
            ExamVersion = currentVersion,
            UserID = userId,
            Score = finalScore,
            TimeSpent = request.TotalTimeSpent,
            CreatedAt = DateTime.UtcNow,
            ResultDetails = resultDetails
        };

        _context.Exam_Results.Add(examResult);

        var examLevelId = exam.LevelID;
        // Cập nhật User_Skill_Matrix 
        await UpdateUserSkillMatrix(userId, resultDetails, examLevelId);

        await _context.SaveChangesAsync();

        var orderedQuestions = currentVersionQuestions
            .OrderBy(eq => eq.OrderIndex)
            .Select(eq => eq.Question!)
            .ToList();

        var reviewQuestions = orderedQuestions.Select(question =>
        {
            answerMap.TryGetValue(question.QuestionID, out var userAnswer);
            var correctAnswer = question.Answers.FirstOrDefault(a => a.IsCorrect);
            var selectedAnswer = userAnswer?.SelectedAnswerID.HasValue == true
                ? question.Answers.FirstOrDefault(a => a.AnswerID == userAnswer.SelectedAnswerID.Value)
                : null;

            bool isCorrect = false;
            if (userAnswer != null)
            {
                if (userAnswer.SelectedAnswerID.HasValue)
                {
                    isCorrect = userAnswer.SelectedAnswerID == correctAnswer?.AnswerID;
                }
                else if (!string.IsNullOrEmpty(userAnswer.TextAnswer))
                {
                    isCorrect = correctAnswer?.AnswerText.Trim().Equals(userAnswer.TextAnswer.Trim(), StringComparison.OrdinalIgnoreCase) ?? false;
                }
            }

            return new ExamReviewQuestionDTO
            {
                QuestionID = question.QuestionID,
                Content = question.Content,
                IsCorrect = isCorrect,
                ResponseTime = userAnswer?.ResponseTime ?? 0,
                SelectedAnswerID = userAnswer?.SelectedAnswerID,
                SelectedAnswerText = selectedAnswer?.AnswerText ?? userAnswer?.TextAnswer,
                CorrectAnswerID = correctAnswer?.AnswerID,
                CorrectAnswerText = correctAnswer?.AnswerText
            };
        }).ToList();

        var response = new SubmitExamResultDTO
        {
            ResultID = examResult.ResultID,
            ExamID = id,
            ExamTitle = exam.Title,
            ExamDuration = exam.Duration,
            Score = finalScore,
            CorrectAnswers = correctCount,
            TotalQuestions = orderedQuestions.Count,
            TimeSpent = request.TotalTimeSpent,
            Questions = reviewQuestions
        };

        return Ok(response);
    } 
}

}