using QuizzTiengNhat.DTOs.Chat;

namespace QuizzTiengNhat.Services
{
    public interface IChatService
    {
        Task<IReadOnlyList<ChatConversationListItemDto>> GetConversationsAsync(string userId, bool isAdmin);
        Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(string userId, bool isAdmin, Guid conversationId, Guid? beforeMessageId, int take);
        Task<SendChatMessageResultDto> SendMessageAsync(string senderId, bool senderIsAdmin, Guid? conversationId, string content);
        Task<bool> CanAccessConversationAsync(string userId, bool isAdmin, Guid conversationId);
    }
}
