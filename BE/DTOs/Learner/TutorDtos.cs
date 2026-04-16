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

    /// <summary>Mã JLPT (N5–N1) theo hồ sơ học viên — dùng cho character-chat.</summary>
    [MaxLength(8)]
    public string? LearnerJlptLevel { get; set; }
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

public class TutorCharacterReplyDto
{
    public string VietnameseText { get; set; } = string.Empty;
    public string JapaneseSpeech { get; set; } = string.Empty;
}

public class TutorSpeechRequestDto
{
    [Required]
    public string Text { get; set; } = string.Empty;

    public int? SpeakerId { get; set; }
}

public class TutorCreateConversationRequestDto
{
    [MaxLength(256)]
    public string? Title { get; set; }

    /// <summary>Id model Live2D (vd. huohuo, aniya) — bắt buộc để tách hội thoại theo nhân vật.</summary>
    [MaxLength(64)]
    public string? Live2dModelId { get; set; }
}

public class TutorCreateConversationResponseDto
{
    public int Id { get; set; }
}

public class TutorAppendTurnRequestDto
{
    /// <summary>Phải khớp hội thoại (cùng nhân vật Live2D).</summary>
    [MaxLength(64)]
    public string? Live2dModelId { get; set; }

    [Required]
    [MaxLength(64)]
    public string UserClientMessageId { get; set; } = string.Empty;

    [Required]
    public string UserContent { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string AssistantClientMessageId { get; set; } = string.Empty;

    public string? VietnameseText { get; set; }
    public string? JapaneseSpeech { get; set; }

    [MaxLength(32)]
    public string? Expression { get; set; }

    /// <summary>Optional WAV bytes as base64 (data URL prefix allowed).</summary>
    public string? AudioWavBase64 { get; set; }

    public int? SpeakerId { get; set; }
}

public class TutorAppendTurnResponseDto
{
    public int ConversationId { get; set; }
    public int UserMessageId { get; set; }
    public int AssistantMessageId { get; set; }
    public string? AudioPublicUrl { get; set; }
}

public class TutorConversationListItemDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Live2dModelId { get; set; } = string.Empty;
}

public class TutorConversationDetailDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Live2dModelId { get; set; } = string.Empty;
    public List<TutorConversationMessageDto> Messages { get; set; } = new();
}

public class TutorConversationMessageDto
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string ClientMessageId { get; set; } = string.Empty;
    public string? PlainContent { get; set; }
    public string? VietnameseText { get; set; }
    public string? JapaneseSpeech { get; set; }
    public string? Expression { get; set; }
    public string? AudioPublicUrl { get; set; }
}
