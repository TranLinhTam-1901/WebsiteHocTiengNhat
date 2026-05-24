using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuizzTiengNhat.Configurations;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Services.Learners;

internal static class TutorExpressionNormalize
{
    /// <summary>Legacy Neutral/neutral không còn dùng — lưu null để client replay dùng Thanks/default.</summary>
    public static string? FromClient(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var t = raw.Trim();
        if (t.Length > 32) t = t[..32];
        if (string.Equals(t, "neutral", StringComparison.OrdinalIgnoreCase)) return null;
        return t;
    }
}

public class TutorArchiveService : ITutorArchiveService
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly VoicevoxOptions _voicevox;

    public TutorArchiveService(
        ApplicationDbContext db,
        IWebHostEnvironment env,
        IOptions<VoicevoxOptions> voicevoxOptions)
    {
        _db = db;
        _env = env;
        _voicevox = voicevoxOptions.Value;
    }

    public async Task<int> CreateConversationAsync(string userId, string? title, string live2dModelId, CancellationToken cancellationToken = default)
    {
        var modelId = string.IsNullOrWhiteSpace(live2dModelId) ? "huohuo" : live2dModelId.Trim();
        if (modelId.Length > 64)
            modelId = modelId[..64];

        var conv = new TutorAiConversation
        {
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim()[..Math.Min(title.Trim().Length, 256)],
            Live2dModelId = modelId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.TutorAiConversations.Add(conv);
        await _db.SaveChangesAsync(cancellationToken);
        return conv.Id;
    }

    public async Task<IReadOnlyList<TutorConversationListItemDto>> ListConversationsAsync(string userId, string live2dModelId, CancellationToken cancellationToken = default)
    {
        var modelId = string.IsNullOrWhiteSpace(live2dModelId) ? "huohuo" : live2dModelId.Trim();
        if (modelId.Length > 64)
            modelId = modelId[..64];

        return await _db.TutorAiConversations
            .AsNoTracking()
            .Where(c => c.UserId == userId && c.Live2dModelId == modelId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new TutorConversationListItemDto
            {
                Id = c.Id,
                Title = c.Title,
                UpdatedAt = c.UpdatedAt,
                Live2dModelId = c.Live2dModelId
            })
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    public async Task<TutorConversationDetailDto?> GetConversationAsync(string userId, int conversationId, string live2dModelId, CancellationToken cancellationToken = default)
    {
        var modelId = string.IsNullOrWhiteSpace(live2dModelId) ? "huohuo" : live2dModelId.Trim();
        if (modelId.Length > 64)
            modelId = modelId[..64];

        var conv = await _db.TutorAiConversations
            .AsNoTracking()
            .Include(c => c.Messages)
            .ThenInclude(m => m.Audio)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId && c.Live2dModelId == modelId, cancellationToken);

        if (conv == null)
            return null;

        return new TutorConversationDetailDto
        {
            Id = conv.Id,
            Title = conv.Title,
            UpdatedAt = conv.UpdatedAt,
            Live2dModelId = conv.Live2dModelId,
            Messages = conv.Messages
                .OrderBy(m => m.CreatedAt)
                .ThenBy(m => m.Id)
                .Select(m => new TutorConversationMessageDto
                {
                    Id = m.Id,
                    Role = m.Role,
                    ClientMessageId = m.ClientMessageId,
                    PlainContent = m.PlainContent,
                    VietnameseText = m.VietnameseText,
                    JapaneseSpeech = m.JapaneseSpeech,
                    Expression = m.Expression,
                    AudioPublicUrl = m.Audio != null ? m.Audio.PublicUrl : null
                })
                .ToList()
        };
    }

    public async Task<TutorAppendTurnResponseDto?> AppendTurnAsync(string userId, int conversationId, TutorAppendTurnRequestDto dto, CancellationToken cancellationToken = default)
    {
        var conv = await _db.TutorAiConversations.FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);
        if (conv == null)
            return null;

        if (!string.IsNullOrWhiteSpace(dto.Live2dModelId) &&
            !string.Equals(conv.Live2dModelId, dto.Live2dModelId.Trim(), StringComparison.Ordinal))
            return null;

        await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

        var userMsg = await _db.TutorAiMessages.FirstOrDefaultAsync(
            m => m.ConversationId == conversationId && m.ClientMessageId == dto.UserClientMessageId,
            cancellationToken);

        if (userMsg == null)
        {
            userMsg = new TutorAiMessage
            {
                ConversationId = conversationId,
                Role = "user",
                ClientMessageId = dto.UserClientMessageId,
                PlainContent = dto.UserContent.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _db.TutorAiMessages.Add(userMsg);
            await _db.SaveChangesAsync(cancellationToken);
        }

        var assistantMsg = await _db.TutorAiMessages.FirstOrDefaultAsync(
            m => m.ConversationId == conversationId && m.ClientMessageId == dto.AssistantClientMessageId,
            cancellationToken);

        if (assistantMsg == null)
        {
            assistantMsg = new TutorAiMessage
            {
                ConversationId = conversationId,
                Role = "assistant",
                ClientMessageId = dto.AssistantClientMessageId,
                VietnameseText = dto.VietnameseText?.Trim(),
                JapaneseSpeech = dto.JapaneseSpeech?.Trim(),
                Expression = TutorExpressionNormalize.FromClient(dto.Expression),
                CreatedAt = DateTime.UtcNow
            };
            _db.TutorAiMessages.Add(assistantMsg);
            await _db.SaveChangesAsync(cancellationToken);
        }

        string? audioUrl = null;
        if (!string.IsNullOrWhiteSpace(dto.AudioWavBase64))
        {
            var existingAudio = await _db.TutorAiMessageAudios.AsNoTracking().FirstOrDefaultAsync(a => a.MessageId == assistantMsg.Id, cancellationToken);
            if (existingAudio == null)
            {
                var bytes = TryDecodeBase64Wav(dto.AudioWavBase64);
                if (bytes != null && bytes.Length > 0)
                {
                    var dir = Path.Combine(_env.WebRootPath, "uploads", "tutor-audio");
                    Directory.CreateDirectory(dir);
                    var fileName = $"{assistantMsg.Id}.wav";
                    var physical = Path.Combine(dir, fileName);
                    await File.WriteAllBytesAsync(physical, bytes, cancellationToken);
                    audioUrl = $"/uploads/tutor-audio/{fileName}";
                    _db.TutorAiMessageAudios.Add(new TutorAiMessageAudio
                    {
                        MessageId = assistantMsg.Id,
                        PublicUrl = audioUrl,
                        SpeakerId = dto.SpeakerId ?? _voicevox.DefaultSpeakerId,
                        DurationMs = null
                    });
                }
            }
            else
            {
                audioUrl = existingAudio.PublicUrl;
            }
        }

        conv.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var finalAudioUrl = audioUrl;
        if (finalAudioUrl == null)
        {
            finalAudioUrl = await _db.TutorAiMessageAudios.AsNoTracking()
                .Where(a => a.MessageId == assistantMsg.Id)
                .Select(a => a.PublicUrl)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new TutorAppendTurnResponseDto
        {
            ConversationId = conversationId,
            UserMessageId = userMsg.Id,
            AssistantMessageId = assistantMsg.Id,
            AudioPublicUrl = finalAudioUrl
        };
    }

    public async Task<(byte[] Bytes, string ContentType)?> GetMessageAudioAsync(string userId, int messageId, CancellationToken cancellationToken = default)
    {
        var row = await _db.TutorAiMessageAudios
            .AsNoTracking()
            .Include(a => a.Message)
            .ThenInclude(m => m.Conversation)
            .FirstOrDefaultAsync(a => a.MessageId == messageId, cancellationToken);

        if (row == null || row.Message.Conversation.UserId != userId)
            return null;

        var relative = row.PublicUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var physical = Path.GetFullPath(Path.Combine(_env.WebRootPath, relative));
        var root = Path.GetFullPath(_env.WebRootPath);
        if (!physical.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(physical))
            return null;

        var bytes = await File.ReadAllBytesAsync(physical, cancellationToken);
        return (bytes, "audio/wav");
    }

    private static byte[]? TryDecodeBase64Wav(string raw)
    {
        var s = raw.Trim();
        var dataPrefix = "base64,";
        var idx = s.IndexOf(dataPrefix, StringComparison.OrdinalIgnoreCase);
        if (idx >= 0)
            s = s[(idx + dataPrefix.Length)..].Trim();

        s = Regex.Replace(s, @"\s+", "");
        try
        {
            return Convert.FromBase64String(s);
        }
        catch
        {
            return null;
        }
    }
}
