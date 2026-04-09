using QuizzTiengNhat.Controllers.Learners;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Learners
{
    public interface IFlashcardService
    {
        Task<FlashcardItem?> UpdateReviewProgress(Guid itemId, string userId, int quality, int timeTakenSeconds);
        Task ApplyPracticeOutcomeAsync(string userId, Guid entityId, SkillType skillType, bool isCorrect, int timeTakenSeconds, bool persist = true);
        Task<List<FlashcardReviewDTO>> GetDailyReviews(string userId, SkillType? skillType);
        Task<bool> AddToDeckAsync(string userId, AddFlashcardDto model, bool persist = true);
        Task<object> GetFlashcardDetailsAsync(Guid itemId);
        Task<IEnumerable<UserDeckDTO>> GetUserDecksAsync(string userId);
        Task<IEnumerable<FlashcardItemDTO>> GetItemsInDeckAsync(Guid deckId, string userId);
        Task<FlashcardDeck?> CreateDeckAsync(string userId, string name, string? description, IReadOnlyList<(Guid EntityId, SkillType ItemType)> entries);
        Task<bool> UpdateUserCustomDeckAsync(string userId, Guid deckId, string name, string? description, IReadOnlyList<(Guid EntityId, SkillType ItemType)> entries);
        Task<bool> DeleteUserCustomDeckAsync(string userId, Guid deckId);
        Task<List<FlashcardReviewDTO>> GetReviewsByDeckAsync(string userId, Guid deckId, string? mode = null);
        Task<object> GetAvailableEntitiesAsync(string userId, Guid levelId, SkillType type, bool includeOwned = false);
    }
}
