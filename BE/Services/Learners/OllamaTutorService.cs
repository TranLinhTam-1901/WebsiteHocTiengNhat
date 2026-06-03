using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
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

    private static string NormalizeLevel(string? learnerJlptLevel)
    {
        var level = string.IsNullOrWhiteSpace(learnerJlptLevel) ? "N5" : learnerJlptLevel.Trim();
        return level.Length > 8 ? level[..8] : level;
    }

    private const string CommonLanguageRules = """
        NGÔN NGỮ (TUYỆT ĐỐI):
        - Trường "vietnameseText": CHỈ tiếng Việt (giải thích). Không tiếng Anh, không romaji Latin thay furigana.
        - Trường "japaneseSpeech": CHỈ tiếng Nhật (kanji/kana). Không tiếng Anh, không tiếng Việt, không romaji.
        - KHỚP NỘI DUNG: "japaneseSpeech" phải là phần tiếng Nhật diễn đạt CÙNG MỘT Ý với "vietnameseText" (tóm tắt/đọc lại đúng nội dung đã giải thích). Tuyệt đối KHÔNG để hai trường nói hai ý khác nhau.
        - KHÔNG LẶP LẠI CÂU HỎI: Tuyệt đối không chép lại, trích lại hay diễn giải lại câu hỏi của học viên. Trả lời TRỰC TIẾP vào nội dung, đi thẳng vào câu trả lời.
        """;

    private const string AntiEchoRules = """
        CẤM LẶP LẠI CÂU HỎI (CỰC KỲ QUAN TRỌNG):
        - TUYỆT ĐỐI KHÔNG chép lại, dịch lại, hay diễn đạt lại câu hỏi của học viên làm câu trả lời.
        - "vietnameseText" và "japaneseSpeech" phải là LỜI ĐÁP (giải thích/thông tin), KHÔNG phải là chính câu hỏi.
        - Ví dụ SAI (CẤM): Học viên hỏi "Bạn là ai?" → trả lời "Bạn là ai?" hoặc "あなたは誰ですか".
        - Ví dụ ĐÚNG: Học viên hỏi "Bạn là ai?" → vietnameseText "Mình là gia sư tiếng Nhật, sẵn sàng giúp bạn học!", japaneseSpeech "私はあなたの日本語の先生です。".
        - Ví dụ ĐÚNG: Học viên hỏi "Từ せんせい nghĩa là gì?" → vietnameseText "せんせい (先生) nghĩa là 'thầy/cô giáo'.", japaneseSpeech "「先生」は教える人のことです。".
        """;

    private const string AntiEchoBoost =
        "\n\nCẢNH BÁO: Câu trả lời trước đã SAI vì chỉ lặp lại câu hỏi. Lần này BẮT BUỘC phải trả lời đúng NỘI DUNG (giải thích, đáp lại), TUYỆT ĐỐI không chép lại câu hỏi.";

    /// <summary>Trò chuyện thường (không phải hỏi kiến thức): trả lời ngắn, thân thiện.</summary>
    private static string BuildChitchatSystemPrompt(string? learnerJlptLevel, bool antiEchoBoost = false)
    {
        var level = NormalizeLevel(learnerJlptLevel);
        return $$"""
            Bạn là gia sư tiếng Nhật thân thiện. Trình độ học viên: {{level}} (N5 dễ nhất → N1 khó nhất).
            Đây là câu trò chuyện thông thường. Hãy TRẢ LỜI TRỰC TIẾP câu của học viên bằng kiến thức của bạn, NGẮN GỌN, tự nhiên.

            {{AntiEchoRules}}

            {{CommonLanguageRules}}
            - "japaneseSpeech": 1–2 câu tiếng Nhật ngắn, đúng nội dung câu trả lời (KHÔNG phải dịch câu hỏi).

            CHỈ trả về MỘT JSON hợp lệ, không markdown, không văn bản ngoài JSON.
            Khóa: vietnameseText (string), japaneseSpeech (string), answered (luôn là true).
            """ + (antiEchoBoost ? AntiEchoBoost : string.Empty);
    }

    /// <summary>Hỏi kiến thức + có dữ liệu DB: BẮT BUỘC chỉ dùng dữ liệu được cấp, cấm bịa.</summary>
    private static string BuildGroundedSystemPrompt(string? learnerJlptLevel, string knowledge, bool antiEchoBoost = false)
    {
        var level = NormalizeLevel(learnerJlptLevel);
        return $$"""
            Bạn là gia sư tiếng Nhật. Trình độ học viên: {{level}} (điều chỉnh độ khó cách giải thích cho phù hợp).

            QUY TẮC CHỐNG BỊA ĐẶT (TỐI THƯỢNG):
            - CHỈ được trả lời dựa trên "DỮ LIỆU GIÁO TRÌNH" bên dưới. TUYỆT ĐỐI không thêm kiến thức, ví dụ, cách đọc, hay furigana nào không có trong dữ liệu.
            - Nếu dữ liệu KHÔNG chứa thông tin trả lời đúng câu hỏi → đặt "answered" = false và xin lỗi ngắn gọn (đừng cố đoán).
            - Nếu trả lời được → đặt "answered" = true, giải thích bám sát dữ liệu, đúng trọng tâm câu hỏi, phù hợp trình độ {{level}}.

            {{AntiEchoRules}}

            {{CommonLanguageRules}}
            - "vietnameseText": giải thích đúng trọng tâm, ngắn gọn rõ ràng.
            - "japaneseSpeech": 1–3 câu tiếng Nhật tóm tắt đúng nội dung trên, hoặc trích ví dụ có trong dữ liệu.

            ===== DỮ LIỆU GIÁO TRÌNH (nguồn DUY NHẤT) =====
            {{knowledge}}
            ===== HẾT DỮ LIỆU =====

            CHỈ trả về MỘT JSON hợp lệ, không markdown, không văn bản ngoài JSON.
            Khóa: vietnameseText (string), japaneseSpeech (string), answered (boolean).
            """ + (antiEchoBoost ? AntiEchoBoost : string.Empty);
    }

    private const string ApologyVietnamese =
        "Xin lỗi, kiến thức này hiện chưa có trong cơ sở dữ liệu giáo trình của mình nên mình chưa thể trả lời chính xác. Bạn thử hỏi một nội dung khác nhé.";
    private const string ApologyJapanese =
        "すみません、その内容は今の教材データにないので、正確にお答えできません。";

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

    public async Task<TutorCharacterReplyDto> CharacterChatAsync(IReadOnlyList<TutorChatMessageDto> clientMessages, string? learnerJlptLevel, TutorKnowledgeContext? knowledge, CancellationToken cancellationToken = default)
    {
        if (clientMessages.Count == 0)
            throw new ArgumentException("Cần ít nhất một tin nhắn.", nameof(clientMessages));

        // Hỏi kiến thức nhưng DB không có dữ liệu → xin lỗi ngay, KHÔNG gọi Ollama
        // (phản hồi tức thì + tuyệt đối không hallucination). FE sẽ hiển thị biểu cảm "Wrong".
        if (knowledge is { IsKnowledgeQuery: true, HasResults: false })
        {
            return new TutorCharacterReplyDto
            {
                VietnameseText = ApologyVietnamese,
                JapaneseSpeech = ApologyJapanese,
                Found = false
            };
        }

        var trimmed = clientMessages
            .Where(m => m.Role is "user" or "assistant")
            .TakeLast(_options.MaxHistoryMessages)
            .Select(m => new OllamaApiMessage { Role = m.Role, Content = m.Content?.Trim() ?? string.Empty })
            .Where(m => m.Content.Length > 0)
            .ToList();

        if (trimmed.Count == 0)
            throw new ArgumentException("Không có nội dung hợp lệ.", nameof(clientMessages));

        var grounded = knowledge is { HasResults: true };
        var lastUserText = trimmed.LastOrDefault(m => m.Role == "user")?.Content ?? string.Empty;
        var maxTokens = ResolveMaxTokens(grounded);

        async Task<(bool parsed, TutorCharacterReplyDto dto, bool? answered)> AskAsync(bool antiEchoBoost)
        {
            var systemPrompt = grounded
                ? BuildGroundedSystemPrompt(learnerJlptLevel, knowledge!.ContextText, antiEchoBoost)
                : BuildChitchatSystemPrompt(learnerJlptLevel, antiEchoBoost);

            var payloadMessages = new List<OllamaApiMessage> { new() { Role = "system", Content = systemPrompt } };
            payloadMessages.AddRange(trimmed);
            ValidateTotalChars(payloadMessages);

            var rawReply = await SendChatAsync(payloadMessages, cancellationToken, jsonFormat: true, maxTokens: maxTokens);
            var ok = TryParseCharacterReply(rawReply, out var dtoReply, out var ansReply);
            if (!ok)
                dtoReply = new TutorCharacterReplyDto { VietnameseText = rawReply.Trim(), JapaneseSpeech = string.Empty };
            return (ok, dtoReply, ansReply);
        }

        var (okParsed, parsed, answered) = await AskAsync(antiEchoBoost: false);

        // Nếu mô hình lỡ lặp lại câu hỏi → gọi lại MỘT lần với cảnh báo mạnh hơn.
        if (okParsed && IsLikelyEcho(parsed.VietnameseText, lastUserText))
        {
            var retry = await AskAsync(antiEchoBoost: true);
            if (retry.parsed && !IsLikelyEcho(retry.dto.VietnameseText, lastUserText))
            {
                parsed = retry.dto;
                answered = retry.answered;
            }
        }

        if (!okParsed)
        {
            return new TutorCharacterReplyDto
            {
                VietnameseText = parsed.VietnameseText,
                JapaneseSpeech = string.Empty,
                Found = !grounded
            };
        }

        // Chỉ khi câu hỏi có dữ liệu DB mới xét "không trả lời được" để bật biểu cảm Error.
        // Một số model nhỏ (JSON mode) không xuất "answered" → answered = null. Khi đó dựa thêm
        // vào nội dung: nếu câu trả lời mang ý "không biết / không có / xin lỗi" thì coi là không tìm được.
        var cannotAnswer = grounded &&
            (answered == false || (answered == null && LooksLikeCannotAnswer(parsed.VietnameseText)));
        if (cannotAnswer)
        {
            return new TutorCharacterReplyDto
            {
                VietnameseText = string.IsNullOrWhiteSpace(parsed.VietnameseText) ? ApologyVietnamese : parsed.VietnameseText,
                JapaneseSpeech = string.IsNullOrWhiteSpace(parsed.JapaneseSpeech) ? ApologyJapanese : parsed.JapaneseSpeech,
                Found = false
            };
        }

        parsed.Found = true;
        return parsed;
    }

    private void ValidateTotalChars(IReadOnlyList<OllamaApiMessage> messages)
    {
        var total = messages.Sum(m => m.Content.Length);
        if (total > _options.MaxPromptChars)
            throw new ArgumentException($"Nội dung quá dài (tối đa {_options.MaxPromptChars} ký tự).");
    }

    /// <summary>Ưu tiên JSON đúng / ít sáng tạo; bỏ "stop" vì một số runner (llama.cpp) dễ lỗi khi kết hợp với JSON mode.</summary>
    private static Dictionary<string, object> BuildPrimaryInferenceOptions(int numPredict) => new()
    {
        ["temperature"] = 0.12,
        ["top_p"] = 0.35,
        ["num_predict"] = numPredict,
        ["repeat_penalty"] = 1.12,
    };

    /// <summary>Dùng khi lần gọi đầu trả 500 (runner crash / OOM) — thử lại một lần với tham số nhẹ hơn.</summary>
    private static Dictionary<string, object> BuildFallbackInferenceOptions(int numPredict) => new()
    {
        ["temperature"] = 0.45,
        ["top_p"] = 0.92,
        ["num_predict"] = numPredict,
        ["repeat_penalty"] = 1.05,
    };

    /// <summary>
    /// Giới hạn số token sinh ra (num_predict) để tối ưu tốc độ phản hồi:
    /// - Trò chuyện thường: câu ngắn → trần thấp, phản hồi rất nhanh.
    /// - Hỏi kiến thức: cần giải thích → trần cao hơn, nhưng model càng lớn ("thông minh") càng diễn đạt
    ///   gọn nên cần ít token hơn; model nhỏ được nới thêm để giải thích đủ ý mà vẫn chặn trần.
    /// </summary>
    private int ResolveMaxTokens(bool grounded)
    {
        if (!grounded)
            return 220;

        var billions = ParseModelParamBillions(_options.Model);
        if (billions >= 13) return 420;
        if (billions >= 7) return 560;
        return 700;
    }

    /// <summary>Đọc số tỉ tham số từ tên model (vd. "qwen2.5:7b" → 7, "llama3.2:3b" → 3). Mặc định 7 nếu không rõ.</summary>
    private static double ParseModelParamBillions(string? model)
    {
        if (string.IsNullOrWhiteSpace(model))
            return 7;
        var m = Regex.Match(model, @"(\d+(?:\.\d+)?)\s*b\b", RegexOptions.IgnoreCase);
        return m.Success && double.TryParse(m.Groups[1].Value, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var b)
            ? b
            : 7;
    }

    private static readonly Regex CannotAnswerRegex = new(
        @"xin lỗi|không có|chưa có|không biết|không rõ|không tìm thấy|ngoài (cơ sở )?dữ liệu|ngoài (phạm vi )?giáo trình|không thể trả lời|không nằm trong",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>Câu trả lời (tiếng Việt) mang ý "không biết / không có dữ liệu / xin lỗi".</summary>
    private static bool LooksLikeCannotAnswer(string? vietnameseText)
        => !string.IsNullOrWhiteSpace(vietnameseText) && CannotAnswerRegex.IsMatch(vietnameseText);

    /// <summary>
    /// Phát hiện câu trả lời chỉ là lặp lại / dịch lại câu hỏi của học viên (echo) dựa trên độ tương đồng ký tự.
    /// </summary>
    private static bool IsLikelyEcho(string? answer, string? question)
    {
        var a = NormalizeForCompare(answer);
        var q = NormalizeForCompare(question);
        if (a.Length == 0 || q.Length == 0)
            return false;

        if (a == q)
            return true;

        // Một bên gần như nằm trọn trong bên kia (vd. trả lời = câu hỏi + dấu câu).
        if (a.Length >= q.Length * 0.7 && a.Contains(q))
            return true;
        if (q.Length >= a.Length * 0.7 && q.Contains(a))
            return true;

        // Cùng "khung" câu, chỉ khác vài ký tự (vd. dịch せんせい → seisen) → độ tương đồng cao.
        var maxLen = Math.Max(a.Length, q.Length);
        if (maxLen == 0)
            return false;
        var distance = Levenshtein(a, q);
        var similarity = 1.0 - (double)distance / maxLen;
        return similarity >= 0.6;
    }

    /// <summary>Bỏ khoảng trắng, dấu câu, đưa về chữ thường để so khớp echo (giữ chữ cái/chữ số mọi ngôn ngữ).</summary>
    private static string NormalizeForCompare(string? s)
    {
        if (string.IsNullOrWhiteSpace(s))
            return string.Empty;
        var sb = new StringBuilder(s.Length);
        foreach (var ch in s.Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch))
                sb.Append(ch);
        }
        var result = sb.ToString();
        return result.Length > 240 ? result[..240] : result;
    }

    private static int Levenshtein(string a, string b)
    {
        var n = a.Length;
        var m = b.Length;
        if (n == 0) return m;
        if (m == 0) return n;

        var prev = new int[m + 1];
        var curr = new int[m + 1];
        for (var j = 0; j <= m; j++) prev[j] = j;

        for (var i = 1; i <= n; i++)
        {
            curr[0] = i;
            for (var j = 1; j <= m; j++)
            {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                curr[j] = Math.Min(Math.Min(prev[j] + 1, curr[j - 1] + 1), prev[j - 1] + cost);
            }
            (prev, curr) = (curr, prev);
        }
        return prev[m];
    }

    private async Task<string> SendChatAsync(List<OllamaApiMessage> messages, CancellationToken cancellationToken, bool jsonFormat = false, int? maxTokens = null)
    {
        var numPredict = maxTokens ?? 800;
        try
        {
            for (var attempt = 0; attempt < 2; attempt++)
            {
                var body = new OllamaChatRequest
                {
                    Model = _options.Model,
                    Messages = messages,
                    Stream = false,
                    Format = jsonFormat ? "json" : null,
                    Options = attempt == 0
                        ? BuildPrimaryInferenceOptions(numPredict)
                        : BuildFallbackInferenceOptions(Math.Min(numPredict, 640))
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
        public string? Format { get; set; }
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
        public bool? Answered { get; set; }
    }

    private static bool TryParseCharacterReply(string raw, out TutorCharacterReplyDto dto, out bool? answered)
    {
        dto = new TutorCharacterReplyDto();
        answered = null;
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
        answered = payload.Answered;

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
