using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.Models.Enums;
using QuizzTiengNhat.Services.Learners;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/flashcards")]
    [Authorize(Roles = "Learner")]
    public class FlashcardController : ControllerBase
    {
        private readonly IFlashcardService _flashcardService;

        public FlashcardController(IFlashcardService flashcardService)
        {
            _flashcardService = flashcardService;
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

            if (string.IsNullOrWhiteSpace(model.Name))
                return BadRequest(new { message = "Vui lòng nhập tên bộ thẻ." });
            if (model.Items == null || model.Items.Count == 0)
                return BadRequest(new { message = "Vui lòng chọn ít nhất một thẻ." });

            var entries = model.Items
                .Where(x => x.EntityId != Guid.Empty)
                .Select(x => (x.EntityId, x.ItemType))
                .ToList();

            var deck = await _flashcardService.CreateDeckAsync(userId, model.Name, model.Description, entries);
            if (deck == null)
                return BadRequest(new { message = "Không tạo được bộ thẻ. Kiểm tra trình độ JLPT trên hồ sơ và các mục đã chọn có đúng cấp độ của bạn." });

            var updatedDecks = await _flashcardService.GetUserDecksAsync(userId);
            return Ok(updatedDecks);
        }

        [HttpPut("decks/{deckId:guid}")]
        public async Task<IActionResult> UpdateDeck(Guid deckId, [FromBody] UpdateDeckDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (string.IsNullOrWhiteSpace(model.Name))
                return BadRequest(new { message = "Vui lòng nhập tên bộ thẻ." });
            if (model.Items == null || model.Items.Count == 0)
                return BadRequest(new { message = "Vui lòng chọn ít nhất một thẻ." });

            var entries = model.Items
                .Where(x => x.EntityId != Guid.Empty)
                .Select(x => (x.EntityId, x.ItemType))
                .ToList();

            var ok = await _flashcardService.UpdateUserCustomDeckAsync(userId, deckId, model.Name, model.Description, entries);
            if (!ok)
                return BadRequest(new { message = "Không cập nhật được. Chỉ có thể sửa bộ thẻ do bạn tạo, và các mục phải thuộc trình độ của bạn." });

            var updatedDecks = await _flashcardService.GetUserDecksAsync(userId);
            return Ok(updatedDecks);
        }

        [HttpDelete("decks/{deckId:guid}")]
        public async Task<IActionResult> DeleteDeck(Guid deckId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var ok = await _flashcardService.DeleteUserCustomDeckAsync(userId, deckId);
            if (!ok)
                return BadRequest(new { message = "Không xóa được. Chỉ có thể xóa bộ thẻ do bạn tạo." });

            var updatedDecks = await _flashcardService.GetUserDecksAsync(userId);
            return Ok(updatedDecks);
        }

        [HttpGet("review/{deckId}")]
        public async Task<IActionResult> GetReviewByDeck(Guid deckId, [FromQuery] string? mode = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var reviews = await _flashcardService.GetReviewsByDeckAsync(userId, deckId, mode);

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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _flashcardService.UpdateReviewProgress(
                model.ItemId, userId, model.Quality, model.TimeTaken);
            if (result == null) return NotFound("Không tìm thấy thẻ học này.");

            return Ok(new
            {
                nextReview = result.NextReview,
                interval = result.Interval,
                isMastered = result.IsMastered,
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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var items = await _flashcardService.GetItemsInDeckAsync(deckId, userId);
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
        public async Task<IActionResult> GetAvailableEntities([FromQuery] Guid levelId, [FromQuery] SkillType type, [FromQuery] bool includeOwned = false)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var data = await _flashcardService.GetAvailableEntitiesAsync(userId, levelId, type, includeOwned);
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

    public class DeckItemRefDto
    {
        public Guid EntityId { get; set; }
        public SkillType ItemType { get; set; }
    }

    public class CreateDeckDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public List<DeckItemRefDto>? Items { get; set; }
    }

    public class UpdateDeckDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public List<DeckItemRefDto>? Items { get; set; }
    }
}