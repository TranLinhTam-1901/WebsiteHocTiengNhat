using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using QuizzTiengNhat.Services.Learners; // Giả sử bạn để Service ở đây
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/flashcards")]
    [Authorize(Roles = "Learner")]
    public class FlashcardController : ControllerBase
    {
        private readonly IFlashcardService _flashcardService;
        private readonly ApplicationDbContext _context;

        public FlashcardController(IFlashcardService flashcardService, ApplicationDbContext context)
        {
            _flashcardService = flashcardService;
            _context = context;
        }

        [HttpGet("decks")]
        public async Task<ActionResult<List<UserDeckDTO>>> GetDecks()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var decks = await _flashcardService.GetUserDecksAsync(userId);

            return Ok(decks ?? new List<UserDeckDTO>());
        }

        [HttpPost("decks")]
        public async Task<IActionResult> CreateDeck([FromBody] CreateDeckDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _flashcardService.CreateDeckAsync(userId, model.Name, model.Description);

            // Sau khi tạo xong, thay vì chỉ trả về ID, hãy trả về danh sách deck mới nhất 
            // để Frontend cập nhật lại toàn bộ UI
            var updatedDecks = await _flashcardService.GetUserDecksAsync(userId);
            return Ok(updatedDecks);
        }

        [HttpGet("review/{deckId}")]
        public async Task<IActionResult> GetReviewByDeck(Guid deckId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var reviews = await _flashcardService.GetReviewsByDeckAsync(userId, deckId);

            // Trả về danh sách thẻ, nếu rỗng thì Frontend sẽ báo "Đã hoàn thành mục tiêu hôm nay"
            return Ok(reviews);
        }

        // 1. Lấy danh sách thẻ cần ôn tập hôm nay (Cá nhân hóa)
        [HttpGet("daily-review")]
        public async Task<IActionResult> GetDailyReview([FromQuery] SkillType? skillType)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var reviews = await _flashcardService.GetDailyReviews(userId, skillType);
            return Ok(reviews);
        }

        // 2. Cập nhật kết quả sau khi lật thẻ (User bấm 0-5 điểm)
        [HttpPost("update-progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] ReviewUpdateDto model)
        {
            var result = await _flashcardService.UpdateReviewProgress(model.ItemId, model.Quality);
            if (result == null) return NotFound("Không tìm thấy thẻ học này.");

            return Ok(new
            {
                nextReview = result.NextReview,
                interval = result.Interval,
                message = "Đã cập nhật tiến độ học tập!"
            });
        }

        // 3. Thêm một thẻ mới vào kho học tập (Khi user nhấn "Học từ này")
        [HttpPost("add-to-deck")]
        public async Task<IActionResult> AddToDeck([FromBody] AddFlashcardDto model)
        {
            // Lấy UserId từ Token (đã qua Authorize)
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _flashcardService.AddToDeckAsync(userId, model);

            if (result)
            {
                return Ok(new { message = "Đã thêm vào kho học tập cá nhân!" });
            }

            return BadRequest("Không thể thêm thẻ vào kho.");
        }

        [HttpGet("deck-details/{deckId}")]
        public async Task<IActionResult> GetDeckItems(Guid deckId)
        {
            // Trả về danh sách các FlashcardItem thuộc Deck này kèm thông tin từ vựng/kanji
            var items = await _flashcardService.GetItemsInDeckAsync(deckId);
            return Ok(items);
        }

        [HttpGet("details/{itemId}")]
        public async Task<IActionResult> GetDetails(Guid itemId)
        {
            var details = await _flashcardService.GetFlashcardDetailsAsync(itemId);
            if (details == null) return NotFound("Không tìm thấy thông tin chi tiết.");
            return Ok(details);
        }

        [HttpGet("available-entities")]
        public async Task<IActionResult> GetAvailableEntities([FromQuery] Guid levelId, [FromQuery] SkillType type)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var data = await _flashcardService.GetAvailableEntitiesAsync(userId, levelId, type);
            return Ok(data);
        }
    }

    public class ReviewUpdateDto
    {
        public Guid ItemId { get; set; }
        public int Quality { get; set; } // 0-5
        public int TimeTaken { get; set; }
    }

    public class AddFlashcardDto
    {
        public Guid EntityId { get; set; }
        public SkillType ItemType { get; set; }
    }

    public class CreateDeckDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
    }
}