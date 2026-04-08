using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Controllers.Learners;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Learners
{
    public class QuestionService : IQuestionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFlashcardService _flashcardService;

        public QuestionService(ApplicationDbContext context, IFlashcardService flashcardService)
        {
            _context = context;
            _flashcardService = flashcardService;
        }

        public async Task<List<Questions>> GetQuestionsByFilterAsync(SkillPracticeDTO filter)
        {
            var query = _context.Questions
                .Include(q => q.Answers)
                .Include(q => q.SubQuestions).ThenInclude(sq => sq.Answers)
                .AsNoTracking()
                .AsQueryable();

            // 1. Lọc theo bài học
            if (filter.LessonIds?.Any() == true)
                query = query.Where(q => filter.LessonIds.Contains(q.LessonID));

            // 2. Lọc theo Topic
            if (filter.TopicIds?.Any() == true)
                query = query.Where(q => q.QuestionTopics.Any(qt => filter.TopicIds.Contains(qt.TopicID)));

            // 3. LỌC NÂNG CAO (Join sang bảng Grammars qua EquivalentID)
            // Chỉ lọc nếu User có yêu cầu lọc theo Sắc thái hoặc Loại ngữ pháp
            if ((filter.FormalityLevels?.Any() == true) || (filter.GrammarCategories?.Any() == true))
            {
                query = from q in query
                        join g in _context.Grammars on q.EquivalentID equals g.GrammarID
                        where (filter.FormalityLevels == null || !filter.FormalityLevels.Any() || filter.FormalityLevels.Contains(g.Formality))
                           && (filter.GrammarCategories == null || !filter.GrammarCategories.Any() || filter.GrammarCategories.Contains(g.GrammarType))
                        select q;
            }

            // 4. Chỉ lấy câu hỏi CHA
            query = query.Where(q => q.ParentID == null);

            // TỐI ƯU RANDOM: Lấy ID trước
            var allIds = await query.Select(q => q.QuestionID).ToListAsync();
            var selectedIds = allIds.OrderBy(x => Guid.NewGuid())
                                    .Take(filter.Limit > 0 ? filter.Limit : 20)
                                    .ToList();

            return await _context.Questions
                .Include(q => q.Answers)
                .Include(q => q.SubQuestions).ThenInclude(sq => sq.Answers)
                .Where(q => selectedIds.Contains(q.QuestionID))
                .ToListAsync();
        }

        public async Task<object> CheckAnswerWithLoggingAsync(string userId, Guid questionId, Guid? selectedAnswerId, string? textAnswer, int timeTaken)
        {
            var question = await _context.Questions
                .Include(q => q.Answers)
                .FirstOrDefaultAsync(q => q.QuestionID == questionId);

            if (question == null) return new { message = "Câu hỏi không tồn tại" };

            bool isCorrect = false;
            string? correctAnswerText = null;

            // Phân nhánh cách chấm điểm dựa vào loại câu hỏi
            if (question.QuestionType == QuestionType.FillInBlank || question.QuestionType == QuestionType.TextCompletion)
            {
                // Câu hỏi điền từ/tự luận: So sánh chữ user gõ với chữ lưu trong đáp án đúng
                var correctAnswer = question.Answers.FirstOrDefault(a => a.IsCorrect);
                correctAnswerText = correctAnswer?.AnswerText;

                if (correctAnswer != null && !string.IsNullOrWhiteSpace(textAnswer))
                {
                    // So sánh text (bỏ qua khoảng trắng thừa)
                    isCorrect = correctAnswer.AnswerText.Trim().Equals(textAnswer.Trim(), StringComparison.OrdinalIgnoreCase);
                }
            }
            else
            {
                // Câu hỏi trắc nghiệm bình thường: Check theo ID
                var selectedAnswer = question.Answers.FirstOrDefault(a => a.AnswerID == selectedAnswerId);
                isCorrect = selectedAnswer?.IsCorrect ?? false;
                correctAnswerText = question.Answers.FirstOrDefault(a => a.IsCorrect)?.AnswerText;
            }

            // --- LƯU LỊCH SỬ LÀM BÀI ---
            var history = new UserAnswerHistory
            {
                HistoryID = Guid.NewGuid(),
                UserID = userId,
                QuestionID = questionId,
                SelectedAnswerID = selectedAnswerId,
                TextAnswer = textAnswer, // Lưu lại chữ user gõ
                IsCorrect = isCorrect,
                TimeTaken = timeTaken,
                AnsweredAt = DateTime.UtcNow
            };
            _context.UserAnswerHistories.Add(history);
            // -------------------------

            if (question.EquivalentID.HasValue)
            {
                await _flashcardService.ApplyPracticeOutcomeAsync(
                    userId,
                    question.EquivalentID.Value,
                    question.SkillType,
                    isCorrect,
                    timeTaken,
                    persist: false);
            }

            if (!isCorrect && question.EquivalentID.HasValue)
            {
                await _flashcardService.AddToDeckAsync(userId, new AddFlashcardDto
                {
                    EntityId = question.EquivalentID.Value,
                    ItemType = question.SkillType
                }, persist: false);
            }

            await _context.SaveChangesAsync();

            return new
            {
                isCorrect = isCorrect,
                explanation = question.Explanation,
                correctAnswer = correctAnswerText,
                message = isCorrect ? "Tuyệt vời!" : "Đã thêm nội dung này vào kho ôn tập."
            };
        }
    }
}