using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using QuizzTiengNhat.Configurations;

namespace QuizzTiengNhat.Services.Learners;

/// <summary>
/// STT qua <c>POST /v1/audio/transcriptions</c> (multipart: file, model, language) — tương thích Docker
/// <c>onerahmet/openai-whisper-asr-webservice:latest</c>.
/// </summary>
public class WhisperSpeechToTextService : IWhisperSpeechToTextService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly WhisperOptions _options;

    public WhisperSpeechToTextService(HttpClient httpClient, IOptions<WhisperOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.BaseUrl)
        && Uri.TryCreate(_options.BaseUrl.Trim(), UriKind.Absolute, out var u)
        && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps);

    public async Task<string> TranscribeAsync(Stream audioStream, string fileName, string? contentType, string? language, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("Whisper chưa cấu hình.");

        using var content = new MultipartFormDataContent();

        var mediaType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim();
        var streamContent = new StreamContent(audioStream);
        
        if (MediaTypeHeaderValue.TryParse(mediaType, out var parsedMt))
            streamContent.Headers.ContentType = parsedMt;
        else
            streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

        var finalFileName = string.IsNullOrWhiteSpace(fileName) ? "audio.webm" : fileName.Trim();
        content.Add(streamContent, "audio_file", finalFileName);

        // 1. CHỈ ĐỊNH NGÔN NGỮ RÕ RÀNG (Mặc định là tiếng Nhật)
        var lang = string.IsNullOrWhiteSpace(language) ? "ja" : NormalizeLanguage(language);

        // 2. CÂU MỒI (INITIAL PROMPT) - ÉP WHISPER VÀO NGỮ CẢNH
        // Cung cấp một câu mẫu để AI biết nó đang mong đợi từ vựng, văn phong gì.
        string initialPrompt = lang == "vi" 
            ? "Đây là câu nói tiếng Việt chuẩn. Xin chào, tôi đang học ngoại ngữ."
            : "これは日本語のテストです。こんにちは、はじめまして。"; // Câu mồi cho N5/N4

        // 3. THIẾT LẬP CÁC THAM SỐ TỐI THƯỢNG
        var queryParams = new List<string> 
        { 
            "task=transcribe", 
            "output=json", 
            $"language={lang}", 
            "temperature=0.0",              // Khóa chặt tính sáng tạo
            "vad_filter=true",              // BỘ LỌC VAD: Chặn đứng âm thanh môi trường
            $"initial_prompt={Uri.EscapeDataString(initialPrompt)}" // Đưa câu mồi vào URL
        };
        
        var requestUrl = "asr?" + string.Join("&", queryParams);

        try
        {
            using var response = await _httpClient.PostAsync(requestUrl, content, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Whisper Debug Error: {body}");
                throw new WhisperSttException($"Whisper API lỗi ({(int)response.StatusCode}): {body}");
            }

            var parsed = JsonSerializer.Deserialize<WhisperTranscriptionResponse>(body, JsonOptions);
            var text = parsed?.Text?.Trim();

            // Với vad_filter=true, nếu chỉ có tiếng ồn, text sẽ trả về rỗng ngay tại đây.
            if (string.IsNullOrEmpty(text))
                throw new WhisperSttException("Hãy đợi vài giây sau rồi hẳn bấm nút mic nhé!");

            // Lớp bảo vệ cuối cùng (Blacklist)
            string[] hallucinationBlacklist = { 
                "Ghiền Mì Gõ", "subscribe", "Cảm ơn các bạn", 
                "Watching", "Thank you", "kênh YouTube", "nhấn chuông" 
            };

            if (hallucinationBlacklist.Any(b => text.Contains(b, StringComparison.OrdinalIgnoreCase)))
            {
                throw new WhisperSttException("Tôi không nghe rõ giọng của bạn, vui lòng nói lại nhé!");
            }

            return text;
        }
        catch (Exception ex) when (ex is not WhisperSttException)
        {
            throw new WhisperSttException($"Lỗi hệ thống khi gọi Whisper: {ex.Message}", ex);
        }
    }
    
    private static string? NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return null;
        var t = language.Trim().ToLowerInvariant();
        if (t.StartsWith("vi", StringComparison.Ordinal))
            return "vi";
        if (t.StartsWith("ja", StringComparison.Ordinal))
            return "ja";
        if (t.Length == 2)
            return t;
        return null;
    }

    private sealed class WhisperTranscriptionResponse
    {
        public string? Text { get; set; }
    }
}

public class WhisperSttException : Exception
{
    public WhisperSttException(string message) : base(message) { }
    public WhisperSttException(string message, Exception inner) : base(message, inner) { }
}
