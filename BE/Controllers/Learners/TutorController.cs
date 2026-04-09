using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Services.Learners;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learners;

[ApiController]
[Route("api/tutor")]
[Authorize(Roles = "Learner")]
public class TutorController : ControllerBase
{
    private readonly IOllamaTutorService _ollamaTutorService;

    public TutorController(IOllamaTutorService ollamaTutorService)
    {
        _ollamaTutorService = ollamaTutorService;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] TutorChatRequestDto model, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (model.Messages == null || model.Messages.Count == 0)
            return BadRequest(new { message = "Cần gửi ít nhất một tin nhắn trong messages." });

        foreach (var m in model.Messages)
        {
            if (string.IsNullOrWhiteSpace(m.Role) || string.IsNullOrWhiteSpace(m.Content))
                return BadRequest(new { message = "Mỗi tin nhắn cần có role và content." });
            if (m.Role is not ("user" or "assistant"))
                return BadRequest(new { message = "Role chỉ được là user hoặc assistant." });
        }

        try
        {
            var reply = await _ollamaTutorService.ChatAsync(model.Messages, cancellationToken);
            return Ok(new { reply });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (OllamaTutorException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpPost("explain-mistake")]
    public async Task<IActionResult> ExplainMistake([FromBody] TutorExplainMistakeRequestDto model, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(model.QuestionContent))
            return BadRequest(new { message = "QuestionContent là bắt buộc." });

        try
        {
            var explanation = await _ollamaTutorService.ExplainMistakeAsync(model, cancellationToken);
            return Ok(new { explanation });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (OllamaTutorException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }
}
