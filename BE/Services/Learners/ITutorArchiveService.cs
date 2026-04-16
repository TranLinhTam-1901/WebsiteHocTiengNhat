using QuizzTiengNhat.DTOs.Learner;

namespace QuizzTiengNhat.Services.Learners;

public interface ITutorArchiveService
{
    Task<int> CreateConversationAsync(string userId, string? title, string live2dModelId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TutorConversationListItemDto>> ListConversationsAsync(string userId, string live2dModelId, CancellationToken cancellationToken = default);

    Task<TutorConversationDetailDto?> GetConversationAsync(string userId, int conversationId, string live2dModelId, CancellationToken cancellationToken = default);

    Task<TutorAppendTurnResponseDto?> AppendTurnAsync(string userId, int conversationId, TutorAppendTurnRequestDto dto, CancellationToken cancellationToken = default);

    Task<(byte[] Bytes, string ContentType)?> GetMessageAudioAsync(string userId, int messageId, CancellationToken cancellationToken = default);
}
