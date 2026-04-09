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
            var now = DateTime.UtcNow;

            var reviewCount = await _context.FlashcardItems
                .Where(f => _context.FlashcardDecks.Any(d => d.DeckID == f.DeckID && d.UserID == userId)
                       && f.NextReview <= now)
                .CountAsync();

            var weakTopics = await _context.UserAnswerHistories
                .Where(h => h.UserID == userId && !h.IsCorrect)
                .GroupBy(h => h.Question.QuestionTopics.Select(qt => qt.Topic.TopicName).FirstOrDefault())
                .OrderByDescending(g => g.Count())
                .Take(2)
                .Select(g => g.Key)
                .ToListAsync();

            var avgTime = await _context.UserAnswerHistories
                .Where(h => h.UserID == userId && h.IsCorrect)
                .OrderByDescending(h => h.AnsweredAt)
                .Take(20)
                .AverageAsync(h => (double?)h.TimeTaken) ?? 0;

            var decks = await _context.FlashcardDecks
                .Include(d => d.Items)
                .Where(d => d.UserID == userId)
                .ToListAsync();

            var decksReadyForSrsReview = decks.Count(d =>
            {
                var n = d.Items.Count;
                if (n == 0) return false;
                var mastered = d.Items.Count(i => i.IsMastered);
                var due = d.Items.Count(i => i.NextReview <= now);
                return mastered == n && due > 0;
            });

            DateTime? nextScheduledReview = null;
            foreach (var d in decks)
            {
                foreach (var i in d.Items)
                {
                    if (i.NextReview <= now) continue;
                    if (nextScheduledReview == null || i.NextReview < nextScheduledReview)
                        nextScheduledReview = i.NextReview;
                }
            }

            var lowEaseCount = await _context.FlashcardItems
                .CountAsync(f => _context.FlashcardDecks.Any(d => d.DeckID == f.DeckID && d.UserID == userId)
                                  && f.EF < 2.0);

            return new
            {
                ReviewCount = reviewCount,
                DecksDueForFullReview = decksReadyForSrsReview,
                NextScheduledReviewUtc = nextScheduledReview,
                LowEaseCardCount = lowEaseCount,
                WeakPoints = weakTopics,
                SystemMessage = reviewCount > 10
                    ? "Kho thẻ của bạn đang quá tải, hãy dành 5 phút ôn tập nhé!"
                    : decksReadyForSrsReview > 0
                        ? $"Có {decksReadyForSrsReview} bộ thẻ đã học xong và đến lịch SRS — mở Flashcards để ôn lại toàn bộ."
                        : "Tiến độ rất tốt! Hãy thử thách với các bài học mới.",
                FocusSuggestion = avgTime > 10
                    ? "Bạn hiểu bài nhưng phản xạ hơi chậm, hãy thử luyện tập với áp lực thời gian."
                    : "Phản xạ của bạn rất tuyệt vời!"
            };
        }
    }
}
