using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Learners
{
    public class UserProgressService : IUserProgressService
    {
        private readonly ApplicationDbContext _context;

        public UserProgressService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<double> GetTopicProgressAsync(string userId, Guid topicId)
        {
            // 1. Tổng số từ vựng trong Topic này
            var totalVocabsInTopic = await _context.VocabTopics
                .CountAsync(vt => vt.TopicID == topicId);

            if (totalVocabsInTopic == 0) return 0;

            // 2. Đếm số thẻ Flashcard thuộc Topic này, là Vocabulary và đã IsMastered
            var masteredCount = await _context.FlashcardItems
                .Where(fi => fi.Deck.UserID == userId
                          && fi.ItemType == SkillType.Vocabulary // Quan trọng: Phải là loại Vocabulary
                          && fi.IsMastered == true)
                .Where(fi => _context.VocabTopics.Any(vt => vt.TopicID == topicId && vt.VocabID == fi.EntityID))
                .CountAsync();

            return Math.Round((double)masteredCount / totalVocabsInTopic * 100, 2);
        }

        public async Task<object> GetPersonalizedSuggestionsAsync(string userId)
        {
            // 1. Lấy danh sách các thẻ Flashcard đã đến hạn hoặc quá hạn ôn tập (SRS)
            var reviewCount = await _context.FlashcardItems
                .Where(f => _context.FlashcardDecks.Any(d => d.DeckID == f.DeckID && d.UserID == userId)
                       && f.NextReview <= DateTime.UtcNow)
                .CountAsync();

            // 2. Tìm "Điểm mù": Những Topic mà User làm sai nhiều nhất trong 50 câu gần đây
            var weakTopics = await _context.UserAnswerHistories
                .Where(h => h.UserID == userId && !h.IsCorrect)
                .GroupBy(h => h.Question.QuestionTopics.Select(qt => qt.Topic.TopicName).FirstOrDefault())
                .OrderByDescending(g => g.Count())
                .Take(2) // Lấy 2 topic yếu nhất
                .Select(g => g.Key)
                .ToListAsync();

            // 3. Phân tích tốc độ: Nếu TimeTaken trung bình > 10s cho các câu đúng -> Cần luyện phản xạ
            var avgTime = await _context.UserAnswerHistories
                .Where(h => h.UserID == userId && h.IsCorrect)
                .OrderByDescending(h => h.AnsweredAt)
                .Take(20)
                .AverageAsync(h => (double?)h.TimeTaken) ?? 0;

            // 4. Tổng hợp lộ trình cá nhân hóa
            return new
            {
                ReviewCount = reviewCount,
                WeakPoints = weakTopics,
                SystemMessage = reviewCount > 10
                    ? "Kho thẻ của bạn đang quá tải, hãy dành 5 phút ôn tập nhé!"
                    : "Tiến độ rất tốt! Hãy thử thách với các bài học mới.",
                FocusSuggestion = avgTime > 10
                    ? "Bạn hiểu bài nhưng phản xạ hơi chậm, hãy thử luyện tập với áp lực thời gian."
                    : "Phản xạ của bạn rất tuyệt vời!"
            };
        }
    }
}
