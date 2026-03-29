namespace QuizzTiengNhat.DTOs.Chat
{
    public class ChatConversationListItemDto
    {
        public Guid Id { get; set; }
        public string LearnerId { get; set; } = null!;
        public string LearnerName { get; set; } = null!;
        public string LearnerEmail { get; set; } = null!;
        public string AssignedAdminId { get; set; } = null!;
        public string AssignedAdminName { get; set; } = null!;
        public string? LastMessagePreview { get; set; }
        public DateTime LastMessageAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChatMessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public string SenderId { get; set; } = null!;
        public string SenderName { get; set; } = null!;
        public bool IsFromAdmin { get; set; }
        public string Content { get; set; } = null!;
        public DateTime SentAt { get; set; }
    }

    public class SendChatMessageResultDto
    {
        public ChatMessageDto Message { get; set; } = null!;
        public Guid ConversationId { get; set; }
        public ChatConversationListItemDto? ConversationPreview { get; set; }
    }
}
