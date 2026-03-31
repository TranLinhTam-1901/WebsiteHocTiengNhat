using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.Services.Learners;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/dashboard")]
    [Authorize(Roles = "Learner")]
    public class LearnerDashboardController : ControllerBase
    {
        private readonly IVocabService _vocabService;
        private readonly IUserProgressService _progressService;

        public LearnerDashboardController(IVocabService vocabService, IUserProgressService progressService)
        {
            _vocabService = vocabService;
            _progressService = progressService;
        }

        // API lấy danh sách từ vựng theo Topic kèm theo % tiến độ của User
        [HttpGet("topic/{topicId}")]
        public async Task<IActionResult> GetTopicDetail(Guid topicId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var vocabs = await _vocabService.GetVocabsByTopicAsync(topicId);
            var progress = await _progressService.GetTopicProgressAsync(userId, topicId);

            return Ok(new
            {
                TopicId = topicId,
                Progress = progress, // Ví dụ: 65.5 (%)
                Vocabularies = vocabs
            });
        }

        [HttpGet("ai-suggestions")]
        public async Task<IActionResult> GetAISuggestions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            // Gọi Service phân tích lịch sử làm bài để tìm "Điểm mù"
            // Ví dụ: "Bạn đang yếu nhóm Động từ N5", "Có 10 từ vựng sắp quên"
            var suggestions = await _progressService.GetPersonalizedSuggestionsAsync(userId);
            return Ok(suggestions);
        }
    }
}
