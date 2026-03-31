using QuizzTiengNhat.Controllers.Learners;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Learners
{
    public interface IFlashcardService
    {
        Task<FlashcardItem> UpdateReviewProgress(Guid itemId, int quality);
        Task<List<FlashcardReviewDTO>> GetDailyReviews(string userId, SkillType? skillType);
        Task<bool> AddToDeckAsync(string userId, AddFlashcardDto model);
        Task<object> GetFlashcardDetailsAsync(Guid itemId);
        Task<IEnumerable<UserDeckDTO>> GetUserDecksAsync(string userId);
        Task<IEnumerable<FlashcardItemDTO>> GetItemsInDeckAsync(Guid deckId);
        Task<FlashcardDeck> CreateDeckAsync(string userId, string name, string description);
        Task<List<FlashcardReviewDTO>> GetReviewsByDeckAsync(string userId, Guid deckId);
        Task<object> GetAvailableEntitiesAsync(string userId, Guid levelId, SkillType type);
    }
}
