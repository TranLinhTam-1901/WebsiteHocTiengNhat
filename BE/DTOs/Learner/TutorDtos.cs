using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Learner;

public class TutorChatMessageDto
{
    [Required]
    public string Role { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;
}

public class TutorChatRequestDto
{
    /// <summary>Conversation turns from the client (user/assistant only; server injects system prompt).</summary>
    public List<TutorChatMessageDto>? Messages { get; set; }
}

public class TutorExplainMistakeRequestDto
{
    [Required]
    public string QuestionContent { get; set; } = string.Empty;

    public string? SkillType { get; set; }
    public string? UserAnswer { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? ExplanationFromSystem { get; set; }
}
