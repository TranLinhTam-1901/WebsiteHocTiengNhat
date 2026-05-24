using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using QuizzTiengNhat.DTOs.Chat;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Services;
using System.Security.Claims;

namespace QuizzTiengNhat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly IBrowserSessionHubCoordinator _sessionCoordinator;

        public ChatHub(IChatService chatService, IBrowserSessionHubCoordinator sessionCoordinator)
        {
            _chatService = chatService;
            _sessionCoordinator = sessionCoordinator;
        }

        public override async Task OnConnectedAsync()
        {
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                var roles = Context.User?.FindAll(ClaimTypes.Role).Select(r => r.Value.ToLower()).ToList() ?? new List<string>();
                var isAdmin = roles.Any(r => r == "admin" || r == "administrator" || string.Equals(r, SD.Role_Admin, StringComparison.OrdinalIgnoreCase));
                var browserId = Context.GetHttpContext()?.Request.Query["browserId"].FirstOrDefault() ?? string.Empty;
                _sessionCoordinator.RegisterConnection(email, Context.ConnectionId, "chat", browserId, isAdmin);
            }

            var rolesForGroup = Context.User?.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList() ?? new List<string>();
            if (rolesForGroup.Any(r => string.Equals(r, SD.Role_Admin, StringComparison.OrdinalIgnoreCase)))
                await Groups.AddToGroupAsync(Context.ConnectionId, "admins");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
                _sessionCoordinator.UnregisterConnection(email, Context.ConnectionId);

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinConversation(Guid conversationId)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new HubException("Unauthorized");

            var isAdmin = Context.User?.IsInRole(SD.Role_Admin) == true;
            if (!await _chatService.CanAccessConversationAsync(userId, isAdmin, conversationId))
                throw new HubException("Không có quyền truy cập hội thoại này.");

            await Groups.AddToGroupAsync(Context.ConnectionId, ConvGroup(conversationId));
        }

        public async Task LeaveConversation(Guid conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ConvGroup(conversationId));
        }

        public async Task SendMessage(Guid? conversationId, string content)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new HubException("Unauthorized");

            var isAdmin = Context.User?.IsInRole(SD.Role_Admin) == true;

            SendChatMessageResultDto result;
            try
            {
                result = await _chatService.SendMessageAsync(userId, isAdmin, conversationId, content);
            }
            catch (UnauthorizedAccessException)
            {
                throw new HubException("Không có quyền gửi tin nhắn.");
            }
            catch (ArgumentException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                throw new HubException(ex.Message);
            }

            var group = ConvGroup(result.ConversationId);
            await Groups.AddToGroupAsync(Context.ConnectionId, group);

            await Clients.Group(group).SendAsync("ReceiveMessage", result.Message);

            if (result.ConversationPreview != null)
                await Clients.Group("admins").SendAsync("ConversationUpdated", result.ConversationPreview);
        }

        private static string ConvGroup(Guid conversationId) => $"conv:{conversationId}";
    }
}
