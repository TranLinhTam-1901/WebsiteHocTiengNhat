using QuizzTiengNhat.DTOs.Learner;

namespace QuizzTiengNhat.Services.Learners;

public interface IOllamaTutorService
{
    Task<string> ChatAsync(IReadOnlyList<TutorChatMessageDto> clientMessages, CancellationToken cancellationToken = default);

    Task<string> ExplainMistakeAsync(TutorExplainMistakeRequestDto request, CancellationToken cancellationToken = default);

    Task<TutorCharacterReplyDto> CharacterChatAsync(IReadOnlyList<TutorChatMessageDto> clientMessages, string? learnerJlptLevel, CancellationToken cancellationToken = default);
}
