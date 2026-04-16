using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models;

public class TutorAiMessage
{
    [Key]
    public int Id { get; set; }

    public int ConversationId { get; set; }

    [ForeignKey(nameof(ConversationId))]
    public TutorAiConversation Conversation { get; set; } = null!;

    [Required]
    [MaxLength(32)]
    public string Role { get; set; } = string.Empty;

    /// <summary>Opaque id from client for dedup / sync (GUID string).</summary>
    [Required]
    [MaxLength(64)]
    public string ClientMessageId { get; set; } = string.Empty;

    /// <summary>User message text or assistant fallback plain text.</summary>
    public string? PlainContent { get; set; }

    public string? VietnameseText { get; set; }
    public string? JapaneseSpeech { get; set; }

    [MaxLength(32)]
    public string? Expression { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TutorAiMessageAudio? Audio { get; set; }
}
