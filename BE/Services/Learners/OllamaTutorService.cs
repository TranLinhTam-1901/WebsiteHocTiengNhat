using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using QuizzTiengNhat.Configurations;
using QuizzTiengNhat.DTOs.Learner;

namespace QuizzTiengNhat.Services.Learners;

public class OllamaTutorService : IOllamaTutorService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private const string SystemPrompt = """
        BẠN LÀ TỪ ĐIỂN NGỮ PHÁP TIẾNG NHẬT TỪ N5 ĐẾN N1.
        Nhiệm vụ của bạn là cung cấp kiến thức TOÀN DIỆN và giải thích lỗi sai cho học viên dựa trên Minna no Nihongo và Shinkanzen Master.

        NGUYÊN TẮC TỐI THƯỢNG:
        1. NGÔN NGỮ TUYỆT ĐỐI: CHỈ dùng tiếng Việt để giải thích. CHỈ dùng tiếng Nhật để cho ví dụ. KHÔNG dùng tiếng Anh, romaji, hay các từ lai tạp tự chế (như "phrasem").
        2. TÍNH TOÀN DIỆN: Một ngữ pháp thường có nhiều cấu trúc (VD: ばかり có V-ta, V-te, Danh từ). BẮT BUỘC phải liệt kê ĐẦY ĐỦ tất cả các trường hợp/ý nghĩa của ngữ pháp đó. Không được giải thích thiếu.
        3. THUẬT NGỮ: Chỉ dùng: V-ru, V-nai, V-ta, V-te, Danh từ (N), Tính từ (A-i, A-na).
        4. CHỐNG BỊA ĐẶT Furigana: Phải cung cấp Furigana chính xác. Nếu không chắc chắn, hãy trả lời: "Kiến thức này nằm ngoài cơ sở dữ liệu giáo trình của tôi."

        ĐỊNH DẠNG TRẢ LỜI BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ FORMAT NÀY):
        [Tổng quan]: (1 câu tóm tắt ngắn gọn về ngữ pháp)

        ✦ Trường hợp 1: [Cấu trúc 1] (VD: V-ta + ばかり)
        - Ý nghĩa: (Tiếng Việt)
        - Cách dùng / Lưu ý: (Phân biệt sắc thái)
        - Ví dụ: (Ít nhất 1 câu tiếng Nhật + Hiragana trong ngoặc + Nghĩa tiếng Việt)

        ✦ Trường hợp 2: [Cấu trúc 2] (Nếu có)
        - Ý nghĩa: ...
        - Cách dùng / Lưu ý: ...
        - Ví dụ: ...

        ✦ Trường hợp 3: [Cấu trúc 3] (Nếu có)
        (Tương tự như trên)

        => [Phân tích lỗi sai của học viên]: 
        (Chỉ ra câu của học viên đang nằm ở trường hợp nào trong các cấu trúc trên, tại sao đáp án của học viên sai và tại sao đáp án hệ thống lại đúng).
        """;

    private static string BuildCharacterSystemPrompt(string? learnerJlptLevel)
    {
        var level = string.IsNullOrWhiteSpace(learnerJlptLevel) ? "N5" : learnerJlptLevel.Trim();
        if (level.Length > 8)
            level = level[..8];

        return $"""
            Bạn là trợ lý học tiếng Nhật (giáo viên thân thiện). Trình độ JLPT mục tiêu của học viên: {level}.
            Điều chỉnh độ khó từ vựng và cấu trúc câu tiếng Nhật trong "japaneseSpeech" cho phù hợp với {level} (N5 đơn giản nhất, N1 tinh vi nhất).

            NGÔN NGỮ (TUYỆT ĐỐI):
            - Trường JSON "vietnameseText": CHỈ tiếng Việt. Không tiếng Anh, không romaji Latin thay furigana, không ký tự ngôn ngữ khác.
            - Trường JSON "japaneseSpeech": CHỈ tiếng Nhật (kanji/kana). Không tiếng Anh, không tiếng Việt, không romaji Latin.
            - Không dùng bất kỳ ngôn ngữ nào khác ngoài tiếng Việt và tiếng Nhật trong toàn bộ phản hồi.

            NỘI DUNG:
            - "vietnameseText": giải thích / trò chuyện với học viên (có thể dài hơn nếu cần).
            - "japaneseSpeech": 1–3 câu tiếng Nhật ngắn, tự nhiên, để đọc TTS (VOICEVOX).

            CHỈ trả về MỘT đối tượng JSON hợp lệ, không markdown, không văn bản ngoài JSON.
            Hai khóa bắt buộc: vietnameseText (tiếng Việt), japaneseSpeech (tiếng Nhật).
            """;
    }

    private static readonly JsonSerializerOptions CharacterJsonDeserializeOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly OllamaOptions _options;

    public OllamaTutorService(HttpClient httpClient, IOptions<OllamaOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<string> ChatAsync(IReadOnlyList<TutorChatMessageDto> clientMessages, CancellationToken cancellationToken = default)
    {
        if (clientMessages.Count == 0)
            throw new ArgumentException("Cần ít nhất một tin nhắn.", nameof(clientMessages));

        var trimmed = clientMessages
            .Where(m => m.Role is "user" or "assistant")
            .TakeLast(_options.MaxHistoryMessages)
            .Select(m => new OllamaApiMessage { Role = m.Role, Content = m.Content?.Trim() ?? string.Empty })
            .Where(m => m.Content.Length > 0)
            .ToList();

        if (trimmed.Count == 0)
            throw new ArgumentException("Không có nội dung hợp lệ.", nameof(clientMessages));

        var payloadMessages = new List<OllamaApiMessage>
        {
            new() { Role = "system", Content = SystemPrompt }
        };
        payloadMessages.AddRange(trimmed);

        ValidateTotalChars(payloadMessages);

        return await SendChatAsync(payloadMessages, cancellationToken);
    }

    public async Task<string> ExplainMistakeAsync(TutorExplainMistakeRequestDto request, CancellationToken cancellationToken = default)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Học viên vừa làm sai một câu trắc nghiệm. Nhiệm vụ của bạn:");
        sb.AppendLine("1. Giải thích ĐẦY ĐỦ tất cả các cấu trúc của điểm ngữ pháp xuất hiện trong câu hỏi.");
        sb.AppendLine("2. Phân tích lỗi sai của học viên dựa trên ĐỊNH DẠNG TRẢ LỜI BẮT BUỘC trong System Prompt.");
        sb.AppendLine();
        sb.AppendLine($"Loại kỹ năng: {request.SkillType ?? "(không rõ)"}");
        sb.AppendLine($"Nội dung câu hỏi: {request.QuestionContent.Trim()}");
        
        if (!string.IsNullOrWhiteSpace(request.UserAnswer))
            sb.AppendLine($"Đáp án học viên chọn / nhập: {request.UserAnswer.Trim()}");
        if (!string.IsNullOrWhiteSpace(request.CorrectAnswer))
            sb.AppendLine($"Đáp án đúng theo hệ thống: {request.CorrectAnswer.Trim()}");
        if (!string.IsNullOrWhiteSpace(request.ExplanationFromSystem))
            sb.AppendLine($"Gợi ý giải thích từ hệ thống: {request.ExplanationFromSystem.Trim()}");

        var userContent = sb.ToString();
        if (userContent.Length > _options.MaxPromptChars)
            userContent = userContent[.._options.MaxPromptChars];

        var messages = new List<OllamaApiMessage>
        {
            new() { Role = "system", Content = SystemPrompt },
            new() { Role = "user", Content = userContent }
        };

        ValidateTotalChars(messages);

        return await SendChatAsync(messages, cancellationToken);
    }

    public async Task<TutorCharacterReplyDto> CharacterChatAsync(IReadOnlyList<TutorChatMessageDto> clientMessages, string? learnerJlptLevel, CancellationToken cancellationToken = default)
    {
        if (clientMessages.Count == 0)
            throw new ArgumentException("Cần ít nhất một tin nhắn.", nameof(clientMessages));

        var trimmed = clientMessages
            .Where(m => m.Role is "user" or "assistant")
            .TakeLast(_options.MaxHistoryMessages)
            .Select(m => new OllamaApiMessage { Role = m.Role, Content = m.Content?.Trim() ?? string.Empty })
            .Where(m => m.Content.Length > 0)
            .ToList();

        if (trimmed.Count == 0)
            throw new ArgumentException("Không có nội dung hợp lệ.", nameof(clientMessages));

        var payloadMessages = new List<OllamaApiMessage>
        {
            new() { Role = "system", Content = BuildCharacterSystemPrompt(learnerJlptLevel) }
        };
        payloadMessages.AddRange(trimmed);

        ValidateTotalChars(payloadMessages);

        var raw = await SendChatAsync(payloadMessages, cancellationToken);
        return TryParseCharacterReply(raw, out var parsed)
            ? parsed
            : new TutorCharacterReplyDto
            {
                VietnameseText = raw.Trim(),
                JapaneseSpeech = string.Empty
            };
    }

    private void ValidateTotalChars(IReadOnlyList<OllamaApiMessage> messages)
    {
        var total = messages.Sum(m => m.Content.Length);
        if (total > _options.MaxPromptChars)
            throw new ArgumentException($"Nội dung quá dài (tối đa {_options.MaxPromptChars} ký tự).");
    }

    /// <summary>Ưu tiên JSON đúng / ít sáng tạo; bỏ "stop" vì một số runner (llama.cpp) dễ lỗi khi kết hợp với JSON mode.</summary>
    private static Dictionary<string, object> BuildPrimaryInferenceOptions() => new()
    {
        ["temperature"] = 0.12,
        ["top_p"] = 0.35,
        ["num_predict"] = 800,
        ["repeat_penalty"] = 1.12,
    };

    /// <summary>Dùng khi lần gọi đầu trả 500 (runner crash / OOM) — thử lại một lần với tham số nhẹ hơn.</summary>
    private static Dictionary<string, object> BuildFallbackInferenceOptions() => new()
    {
        ["temperature"] = 0.45,
        ["top_p"] = 0.92,
        ["num_predict"] = 640,
        ["repeat_penalty"] = 1.05,
    };

    private async Task<string> SendChatAsync(List<OllamaApiMessage> messages, CancellationToken cancellationToken)
    {
        try
        {
            for (var attempt = 0; attempt < 2; attempt++)
            {
                var body = new OllamaChatRequest
                {
                    Model = _options.Model,
                    Messages = messages,
                    Stream = false,
                    Options = attempt == 0 ? BuildPrimaryInferenceOptions() : BuildFallbackInferenceOptions()
                };

                using var content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("api/chat", content, cancellationToken);
                var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

                if (response.IsSuccessStatusCode)
                    return ParseOllamaChatMessageContent(responseText);

                if (attempt == 0 && response.StatusCode == HttpStatusCode.InternalServerError)
                    continue;

                if (response.StatusCode == HttpStatusCode.NotFound)
                    throw new OllamaTutorException($"Model \"{_options.Model}\" có thể chưa được tải. Chạy: ollama pull {_options.Model}");

                throw new OllamaTutorException(FormatOllamaHttpError(response.StatusCode, responseText));
            }
        }
        catch (HttpRequestException ex)
        {
            throw new OllamaTutorException("Không kết nối được tới Ollama. Hãy kiểm tra Ollama đang chạy và BaseUrl trong cấu hình.", ex);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new OllamaTutorException("Ollama phản hồi quá lâu (timeout). Thử lại hoặc đổi model nhẹ hơn.", ex);
        }

        throw new OllamaTutorException(
            "Ollama vẫn trả lỗi 500 sau khi thử lại với tham số an toàn hơn. "
            + "Khả năng cao là thiếu RAM/VRAM hoặc model không tương thích — hãy đổi model nhẹ hơn hoặc khởi động lại Ollama.");
    }

    private string ParseOllamaChatMessageContent(string responseText)
    {
        OllamaChatResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<OllamaChatResponse>(responseText, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new OllamaTutorException("Không đọc được phản hồi từ Ollama.", ex);
        }

        var reply = parsed?.Message?.Content?.Trim();
        if (string.IsNullOrEmpty(reply))
            throw new OllamaTutorException("Ollama trả về nội dung trống.");

        return reply;
    }

    private string FormatOllamaHttpError(HttpStatusCode status, string responseText)
    {
        var raw = responseText.Trim();
        TryExtractOllamaErrorField(raw, out var inner);
        var detail = inner ?? raw;
        if (status == HttpStatusCode.InternalServerError &&
            detail.Contains("runner process", StringComparison.OrdinalIgnoreCase))
        {
            return
                "Tiến trình tạo câu trả lời của Ollama (llama runner) đã thoát đột ngột — thường do thiếu RAM/VRAM, model quá nặng, "
                + "hoặc lỗi phiên bản Ollama. Hãy thử: (1) khởi động lại Ollama; (2) dùng model nhỏ hơn (vd. qwen2.5:3b); "
                + "(3) đóng ứng dụng chiếm GPU; (4) cập nhật Ollama lên bản mới nhất. "
                + $"Chi tiết kỹ thuật: {TruncateForUser(detail, 280)}";
        }

        if (detail.Contains("model", StringComparison.OrdinalIgnoreCase) &&
            (detail.Contains("not found", StringComparison.OrdinalIgnoreCase) || detail.Contains("pull", StringComparison.OrdinalIgnoreCase)))
        {
            return $"{TruncateForUser(detail, 400)} — Gợi ý: ollama pull {_options.Model}";
        }

        return $"Ollama trả lỗi ({(int)status}): {TruncateForUser(string.IsNullOrEmpty(inner) ? raw : inner, 500)}";
    }

    private static bool TryExtractOllamaErrorField(string responseText, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(responseText))
            return false;
        try
        {
            using var doc = JsonDocument.Parse(responseText);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return false;
            if (!doc.RootElement.TryGetProperty("error", out var el))
                return false;
            error = el.ValueKind == JsonValueKind.String ? el.GetString() : el.ToString();
            return !string.IsNullOrWhiteSpace(error);
        }
        catch
        {
            return false;
        }
    }

    private static string TruncateForUser(string s, int maxLen)
    {
        if (string.IsNullOrEmpty(s) || s.Length <= maxLen)
            return s;
        return s[..maxLen] + "…";
    }

    private sealed class OllamaChatRequest
    {
        public string Model { get; set; } = string.Empty;
        public List<OllamaApiMessage> Messages { get; set; } = new();
        public bool Stream { get; set; }
        public Dictionary<string, object>? Options { get; set; }
    }

    private sealed class OllamaApiMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    private sealed class OllamaChatResponse
    {
        public OllamaChatInnerMessage? Message { get; set; }
    }

    private sealed class OllamaChatInnerMessage
    {
        public string? Content { get; set; }
    }

    private sealed class CharacterJsonPayload
    {
        public string? VietnameseText { get; set; }
        public string? JapaneseSpeech { get; set; }
    }

    private static bool TryParseCharacterReply(string raw, out TutorCharacterReplyDto dto)
    {
        dto = new TutorCharacterReplyDto();
        var normalized = ExtractJsonObject(raw);
        if (normalized == null)
            return false;

        CharacterJsonPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<CharacterJsonPayload>(normalized, CharacterJsonDeserializeOptions);
        }
        catch
        {
            return false;
        }

        if (payload == null)
            return false;

        dto.VietnameseText = (payload.VietnameseText ?? string.Empty).Trim();
        dto.JapaneseSpeech = (payload.JapaneseSpeech ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(dto.VietnameseText) && string.IsNullOrWhiteSpace(dto.JapaneseSpeech))
            return false;

        return true;
    }

    private static string? ExtractJsonObject(string raw)
    {
        var t = raw.Trim();
        var start = t.IndexOf('{');
        var end = t.LastIndexOf('}');
        if (start < 0 || end <= start)
            return null;
        return t.Substring(start, end - start + 1);
    }

}

public class OllamaTutorException : Exception
{
    public OllamaTutorException(string message) : base(message) { }
    public OllamaTutorException(string message, Exception inner) : base(message, inner) { }
}
