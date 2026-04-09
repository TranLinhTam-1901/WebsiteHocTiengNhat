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
        Bạn là gia sư tiếng Nhật cho học viên Việt Nam.
        Trả lời bằng tiếng Việt khi học viên dùng tiếng Việt; có thể dùng tiếng Nhật khi cần ví dụ.
        Với bài tập trắc nghiệm/điền từ: đáp án đúng do hệ thống cung cấp là chuẩn — bạn chỉ giải thích, không được bảo đáp án hệ thống sai.
        Nếu không chắc, hãy nói rõ. Từ chối ngắn gọn nội dung có hại hoặc hoàn toàn không liên quan học tập.
        """;

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
        sb.AppendLine("Học viên vừa làm sai một câu trong bài luyện tập. Hãy giải thích thêm bằng tiếng Việt (ngắn gọn nhưng đủ ý), giúp học viên hiểu tại sao đáp án đúng là đúng và cách nhớ.");
        sb.AppendLine();
        sb.AppendLine($"Loại kỹ năng: {request.SkillType ?? "(không rõ)"}");
        sb.AppendLine($"Nội dung câu hỏi: {request.QuestionContent.Trim()}");
        if (!string.IsNullOrWhiteSpace(request.UserAnswer))
            sb.AppendLine($"Đáp án học viên chọn / nhập: {request.UserAnswer.Trim()}");
        if (!string.IsNullOrWhiteSpace(request.CorrectAnswer))
            sb.AppendLine($"Đáp án đúng theo hệ thống: {request.CorrectAnswer.Trim()}");
        if (!string.IsNullOrWhiteSpace(request.ExplanationFromSystem))
            sb.AppendLine($"Gợi ý giải thích có sẵn từ hệ thống (có thể mở rộng, không mâu thuẫn): {request.ExplanationFromSystem.Trim()}");

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

    private void ValidateTotalChars(IReadOnlyList<OllamaApiMessage> messages)
    {
        var total = messages.Sum(m => m.Content.Length);
        if (total > _options.MaxPromptChars)
            throw new ArgumentException($"Nội dung quá dài (tối đa {_options.MaxPromptChars} ký tự).");
    }

    private async Task<string> SendChatAsync(List<OllamaApiMessage> messages, CancellationToken cancellationToken)
    {
        var body = new OllamaChatRequest
        {
            Model = _options.Model,
            Messages = messages,
            Stream = false
        };

        using var content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");
        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsync("api/chat", content, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new OllamaTutorException("Không kết nối được tới Ollama. Hãy kiểm tra Ollama đang chạy và BaseUrl trong cấu hình.", ex);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new OllamaTutorException("Ollama phản hồi quá lâu (timeout). Thử lại hoặc đổi model nhẹ hơn.", ex);
        }

        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
            throw new OllamaTutorException($"Model \"{_options.Model}\" có thể chưa được tải. Chạy: ollama pull {_options.Model}");

        if (!response.IsSuccessStatusCode)
            throw new OllamaTutorException($"Ollama trả lỗi ({(int)response.StatusCode}): {responseText}");

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

    private sealed class OllamaChatRequest
    {
        public string Model { get; set; } = string.Empty;
        public List<OllamaApiMessage> Messages { get; set; } = new();
        public bool Stream { get; set; }
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
}

public class OllamaTutorException : Exception
{
    public OllamaTutorException(string message) : base(message) { }
    public OllamaTutorException(string message, Exception inner) : base(message, inner) { }
}
