using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models;

public class TutorAiConversation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? Title { get; set; }

    /// <summary>Id model Live2D (FE), tách hội thoại theo nhân vật / giọng VOICEVOX.</summary>
    [Required]
    [MaxLength(64)]
    public string Live2dModelId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TutorAiMessage> Messages { get; set; } = new List<TutorAiMessage>();
}
