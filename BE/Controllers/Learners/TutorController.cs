using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Services.Learners;
using System.Security.Claims;
using QuizzTiengNhat.Configurations;
using Microsoft.Extensions.Options;

namespace QuizzTiengNhat.Controllers.Learners;

[ApiController]
[Route("api/tutor")]
[Authorize(Roles = "Learner")]
public class TutorController : ControllerBase
{
    private readonly IOllamaTutorService _ollamaTutorService;
    private readonly IVoicevoxTtsService _voicevoxTtsService;
    private readonly ITutorArchiveService _tutorArchiveService;
    private readonly IWhisperSpeechToTextService _whisperSpeechToText;
    private readonly VoicevoxOptions _voicevoxOptions;
    private readonly WhisperOptions _whisperOptions;

    public TutorController(
        IOllamaTutorService ollamaTutorService,
        IVoicevoxTtsService voicevoxTtsService,
        ITutorArchiveService tutorArchiveService,
        IWhisperSpeechToTextService whisperSpeechToText,
        IOptions<VoicevoxOptions> voicevoxOptions,
        IOptions<WhisperOptions> whisperOptions)
    {
        _ollamaTutorService = ollamaTutorService;
        _voicevoxTtsService = voicevoxTtsService;
        _tutorArchiveService = tutorArchiveService;
        _whisperSpeechToText = whisperSpeechToText;
        _voicevoxOptions = voicevoxOptions.Value;
        _whisperOptions = whisperOptions.Value;
    }

    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] TutorChatRequestDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        if (model.Messages == null || model.Messages.Count == 0)
            return BadRequest(new { message = "Cần gửi ít nhất một tin nhắn trong messages." });

        foreach (var m in model.Messages)
        {
            if (string.IsNullOrWhiteSpace(m.Role) || string.IsNullOrWhiteSpace(m.Content))
                return BadRequest(new { message = "Mỗi tin nhắn cần có role và content." });
            if (m.Role is not ("user" or "assistant"))
                return BadRequest(new { message = "Role chỉ được là user hoặc assistant." });
        }

        try
        {
            var reply = await _ollamaTutorService.ChatAsync(model.Messages, cancellationToken);
            return Ok(new { reply });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (OllamaTutorException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpPost("character-chat")]
    public async Task<IActionResult> CharacterChat([FromBody] TutorChatRequestDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        if (model.Messages == null || model.Messages.Count == 0)
            return BadRequest(new { message = "Cần gửi ít nhất một tin nhắn trong messages." });

        foreach (var m in model.Messages)
        {
            if (string.IsNullOrWhiteSpace(m.Role) || string.IsNullOrWhiteSpace(m.Content))
                return BadRequest(new { message = "Mỗi tin nhắn cần có role và content." });
            if (m.Role is not ("user" or "assistant"))
                return BadRequest(new { message = "Role chỉ được là user hoặc assistant." });
        }

        try
        {
            var reply = await _ollamaTutorService.CharacterChatAsync(model.Messages, model.LearnerJlptLevel, cancellationToken);
            return Ok(reply);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (OllamaTutorException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpPost("explain-mistake")]
    public async Task<IActionResult> ExplainMistake([FromBody] TutorExplainMistakeRequestDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(model.QuestionContent))
            return BadRequest(new { message = "QuestionContent là bắt buộc." });

        try
        {
            var explanation = await _ollamaTutorService.ExplainMistakeAsync(model, cancellationToken);
            return Ok(new { explanation });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (OllamaTutorException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpPost("transcribe")]
    [RequestSizeLimit(32_768_000)]
    public async Task<IActionResult> Transcribe([FromForm] IFormFile? file, [FromForm] string? language, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        if (!_whisperSpeechToText.IsConfigured)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Speech-to-text chưa bật. Cấu hình Whisper:BaseUrl trỏ tới Docker onerahmet/openai-whisper-asr-webservice (mặc định http://127.0.0.1:9000/v1/)." });
        }

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Cần gửi file âm thanh (form field: file)." });

        if (file.Length > _whisperOptions.MaxUploadBytes)
            return BadRequest(new { message = $"File quá lớn (tối đa {_whisperOptions.MaxUploadBytes} bytes)." });

        try
        {
            await using var stream = file.OpenReadStream();
            var text = await _whisperSpeechToText.TranscribeAsync(stream, file.FileName, file.ContentType, language, cancellationToken);
            return Ok(new { text });
        }
        catch (WhisperSttException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = $"Lỗi STT: {ex.Message}" });
        }
    }

    [HttpPost("speech")]
    public async Task<IActionResult> Speech([FromBody] TutorSpeechRequestDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(model.Text))
            return BadRequest(new { message = "Text là bắt buộc." });

        var speaker = model.SpeakerId ?? _voicevoxOptions.DefaultSpeakerId;

        try
        {
            var wav = await _voicevoxTtsService.SynthesizeWavAsync(model.Text, speaker, cancellationToken);
            return File(wav, "audio/wav", fileDownloadName: null);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (VoicevoxTtsException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation([FromBody] TutorCreateConversationRequestDto? model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        var modelId = string.IsNullOrWhiteSpace(model?.Live2dModelId) ? "huohuo" : model!.Live2dModelId!.Trim();
        var id = await _tutorArchiveService.CreateConversationAsync(UserId, model?.Title, modelId, cancellationToken);
        return Ok(new TutorCreateConversationResponseDto { Id = id });
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> ListConversations([FromQuery] string? live2dModelId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        var modelId = string.IsNullOrWhiteSpace(live2dModelId) ? "huohuo" : live2dModelId.Trim();
        var list = await _tutorArchiveService.ListConversationsAsync(UserId, modelId, cancellationToken);
        return Ok(list);
    }

    [HttpGet("conversations/{conversationId:int}")]
    public async Task<IActionResult> GetConversation([FromRoute] int conversationId, [FromQuery] string? live2dModelId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        var modelId = string.IsNullOrWhiteSpace(live2dModelId) ? "huohuo" : live2dModelId.Trim();
        var detail = await _tutorArchiveService.GetConversationAsync(UserId, conversationId, modelId, cancellationToken);
        if (detail == null)
            return NotFound();

        return Ok(detail);
    }

    [HttpPost("conversations/{conversationId:int}/turn")]
    public async Task<IActionResult> AppendTurn([FromRoute] int conversationId, [FromBody] TutorAppendTurnRequestDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(model.UserClientMessageId) || string.IsNullOrWhiteSpace(model.UserContent))
            return BadRequest(new { message = "UserClientMessageId và UserContent là bắt buộc." });
        if (string.IsNullOrWhiteSpace(model.AssistantClientMessageId))
            return BadRequest(new { message = "AssistantClientMessageId là bắt buộc." });

        var result = await _tutorArchiveService.AppendTurnAsync(UserId, conversationId, model, cancellationToken);
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("messages/{messageId:int}/audio")]
    public async Task<IActionResult> GetMessageAudio([FromRoute] int messageId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(UserId))
            return Unauthorized();

        var audio = await _tutorArchiveService.GetMessageAudioAsync(UserId, messageId, cancellationToken);
        if (audio == null)
            return NotFound();

        return File(audio.Value.Bytes, audio.Value.ContentType);
    }
}
