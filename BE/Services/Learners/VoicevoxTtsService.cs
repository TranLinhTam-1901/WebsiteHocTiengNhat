using System.Text;
using Microsoft.Extensions.Options;
using QuizzTiengNhat.Configurations;

namespace QuizzTiengNhat.Services.Learners;

public class VoicevoxTtsService : IVoicevoxTtsService
{
    private readonly HttpClient _httpClient;
    private readonly VoicevoxOptions _options;

    public VoicevoxTtsService(HttpClient httpClient, IOptions<VoicevoxOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _httpClient.Timeout = TimeSpan.FromSeconds(Math.Max(10, _options.TimeoutSeconds));
    }

    private string Root => _options.BaseUrl.TrimEnd('/');

    public async Task<byte[]> SynthesizeWavAsync(string text, int speakerId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Cần có nội dung để đọc.", nameof(text));

        var trimmed = text.Trim();
        
        // Bước 1: audio_query - Truyền text qua Query String
        var queryUrl = $"{Root}/audio_query?text={Uri.EscapeDataString(trimmed)}&speaker={speakerId}";
        using var audioQueryResponse = await _httpClient.PostAsync(queryUrl, null, cancellationToken);
        
        if (!audioQueryResponse.IsSuccessStatusCode)
        {
            var err = await audioQueryResponse.Content.ReadAsStringAsync(cancellationToken);
            throw new VoicevoxTtsException($"VOICEVOX audio_query lỗi ({(int)audioQueryResponse.StatusCode}): {err}");
        }

        var audioQueryJson = await audioQueryResponse.Content.ReadAsStringAsync(cancellationToken);

        // Bước 2: synthesis - Gửi JSON nhận được từ bước 1 vào Body
        using var synthesisBody = new StringContent(audioQueryJson, Encoding.UTF8, "application/json");
        var synthesisUrl = $"{Root}/synthesis?speaker={speakerId}";
        
        // Tăng timeout cho riêng request này nếu cần (vì synthesis rất nặng)
        using var synthesisResponse = await _httpClient.PostAsync(synthesisUrl, synthesisBody, cancellationToken);

        if (!synthesisResponse.IsSuccessStatusCode)
        {
            var errBytes = await synthesisResponse.Content.ReadAsByteArrayAsync(cancellationToken);
            var err = Encoding.UTF8.GetString(errBytes);
            throw new VoicevoxTtsException($"VOICEVOX synthesis lỗi ({(int)synthesisResponse.StatusCode}): {err}");
        }

        return await synthesisResponse.Content.ReadAsByteArrayAsync(cancellationToken);
    }
}

public class VoicevoxTtsException : Exception
{
    public VoicevoxTtsException(string message) : base(message) { }
    public VoicevoxTtsException(string message, Exception inner) : base(message, inner) { }
}
