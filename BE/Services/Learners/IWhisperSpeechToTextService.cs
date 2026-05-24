namespace QuizzTiengNhat.Services.Learners;

public interface IWhisperSpeechToTextService
{
    /// <param name="language">Mã ISO ngắn gợi ý (vd: vi, ja). Có thể null để tự nhận.</param>
    Task<string> TranscribeAsync(Stream audioStream, string fileName, string? contentType, string? language, CancellationToken cancellationToken = default);

    bool IsConfigured { get; }
}
