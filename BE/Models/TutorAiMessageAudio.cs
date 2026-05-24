using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models;

public class TutorAiMessageAudio
{
    [Key]
    public int Id { get; set; }

    public int MessageId { get; set; }

    [ForeignKey(nameof(MessageId))]
    public TutorAiMessage Message { get; set; } = null!;

    /// <summary>Relative URL served under static files, e.g. /uploads/tutor-audio/...</summary>
    [Required]
    [MaxLength(512)]
    public string PublicUrl { get; set; } = string.Empty;

    public int SpeakerId { get; set; }
    public int? DurationMs { get; set; }
}
