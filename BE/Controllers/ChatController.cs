using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Services;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var isAdmin = User.IsInRole(SD.Role_Admin);
            var list = await _chatService.GetConversationsAsync(userId, isAdmin);
            return Ok(list);
        }

        [HttpGet("conversations/{conversationId:guid}/messages")]
        public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] Guid? before, [FromQuery] int take = 30)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var isAdmin = User.IsInRole(SD.Role_Admin);
            var list = await _chatService.GetMessagesAsync(userId, isAdmin, conversationId, before, take);
            return Ok(list);
        }
    }
}
