using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Services.Learners;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/questions")]
    [Authorize(Roles = "Learner")]
    public class QuestionController : ControllerBase
    {
        private readonly IQuestionService _questionService;

        public QuestionController(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpPost("check-answer")]
        public async Task<IActionResult> Check([FromBody] AnswerSubmissionDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Gọi thẳng sang Service, Service đã có logic check QuestionType rồi
            var result = await _questionService.CheckAnswerWithLoggingAsync(
                userId,
                model.QuestionId,
                model.SelectedAnswerId,
                model.TextAnswer,
                model.TimeTaken);

            return Ok(result);
        }
    }
}
public class AnswerSubmissionDto
{
    public Guid QuestionId { get; set; }
    public Guid? SelectedAnswerId { get; set; } // Nên để Nullable
    public string? TextAnswer { get; set; }     // Thêm trường này cho câu hỏi điền từ
    public int TimeTaken { get; set; }
}
