using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Learner;

namespace QuizzTiengNhat.Services.Learners
{
    public interface IQuestionService
    {
        Task<object> CheckAnswerWithLoggingAsync(string userId, Guid questionId, Guid? selectedAnswerId, string? textAnswer, int timeTaken);
        Task<List<Questions>> GetQuestionsByFilterAsync(SkillPracticeDTO filter);
    }
}