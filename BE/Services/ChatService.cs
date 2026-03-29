using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Chat;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Services
{
    public class ChatService : IChatService
    {
        private const int MaxContentLength = 8000;
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public ChatService(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public async Task<IReadOnlyList<ChatConversationListItemDto>> GetConversationsAsync(string userId, bool isAdmin)
        {
            IQueryable<ChatConversation> query = _db.ChatConversations
                .AsNoTracking()
                .Include(c => c.Learner)
                .Include(c => c.AssignedAdmin);

            if (!isAdmin)
                query = query.Where(c => c.LearnerId == userId);
            else
                query = query.OrderByDescending(c => c.LastMessageAt);

            var list = await query.ToListAsync();
            var result = new List<ChatConversationListItemDto>();

            foreach (var c in list.OrderByDescending(x => x.LastMessageAt))
            {
                var lastMsg = await _db.ChatMessages
                    .AsNoTracking()
                    .Where(m => m.ConversationId == c.Id)
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => m.Content)
                    .FirstOrDefaultAsync();

                var preview = lastMsg != null
                    ? (lastMsg.Length > 120 ? lastMsg[..120] + "…" : lastMsg)
                    : null;

                result.Add(new ChatConversationListItemDto
                {
                    Id = c.Id,
                    LearnerId = c.LearnerId,
                    LearnerName = c.Learner?.FullName ?? "",
                    LearnerEmail = c.Learner?.Email ?? "",
                    AssignedAdminId = c.AssignedAdminId,
                    AssignedAdminName = c.AssignedAdmin?.FullName ?? "",
                    LastMessagePreview = preview,
                    LastMessageAt = c.LastMessageAt,
                    CreatedAt = c.CreatedAt
                });
            }

            return result;
        }

        public async Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(string userId, bool isAdmin, Guid conversationId, Guid? beforeMessageId, int take)
        {
            if (!await CanAccessConversationAsync(userId, isAdmin, conversationId))
                return Array.Empty<ChatMessageDto>();

            take = Math.Clamp(take, 1, 100);

            var q = _db.ChatMessages
                .AsNoTracking()
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversationId);

            if (beforeMessageId.HasValue)
            {
                var pivot = await _db.ChatMessages.AsNoTracking().FirstOrDefaultAsync(m => m.Id == beforeMessageId.Value);
                if (pivot != null)
                    q = q.Where(m => m.SentAt < pivot.SentAt);
            }

            var rows = await q
                .OrderByDescending(m => m.SentAt)
                .Take(take)
                .ToListAsync();

            rows.Reverse();

            var adminRole = await _db.Roles.FirstAsync(r => r.Name == SD.Role_Admin);
            var adminUserIds = await _db.UserRoles
                .Where(ur => ur.RoleId == adminRole.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();
            var adminSet = adminUserIds.ToHashSet();

            return rows.Select(m => new ChatMessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender?.FullName ?? "",
                IsFromAdmin = adminSet.Contains(m.SenderId),
                Content = m.Content,
                SentAt = m.SentAt
            }).ToList();
        }

        public async Task<bool> CanAccessConversationAsync(string userId, bool isAdmin, Guid conversationId)
        {
            var c = await _db.ChatConversations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == conversationId);
            if (c == null) return false;
            if (isAdmin) return true;
            return c.LearnerId == userId;
        }

        public async Task<SendChatMessageResultDto> SendMessageAsync(string senderId, bool senderIsAdmin, Guid? conversationId, string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Nội dung không được để trống.");
            content = content.Trim();
            if (content.Length > MaxContentLength)
                throw new ArgumentException($"Nội dung tối đa {MaxContentLength} ký tự.");

            ChatConversation conv;

            if (senderIsAdmin)
            {
                if (!conversationId.HasValue)
                    throw new InvalidOperationException("Admin cần conversationId.");

                conv = await _db.ChatConversations
                    .Include(c => c.Learner)
                    .Include(c => c.AssignedAdmin)
                    .FirstOrDefaultAsync(c => c.Id == conversationId.Value)
                    ?? throw new InvalidOperationException("Không tìm thấy hội thoại.");

            }
            else
            {
                if (conversationId.HasValue)
                {
                    conv = await _db.ChatConversations
                        .Include(c => c.Learner)
                        .Include(c => c.AssignedAdmin)
                        .FirstOrDefaultAsync(c => c.Id == conversationId.Value)
                        ?? throw new InvalidOperationException("Không tìm thấy hội thoại.");

                    if (conv.LearnerId != senderId)
                        throw new UnauthorizedAccessException();
                }
                else
                {
                    var existing = await _db.ChatConversations.FirstOrDefaultAsync(c => c.LearnerId == senderId);
                    if (existing != null)
                    {
                        conv = await _db.ChatConversations
                            .Include(c => c.Learner)
                            .Include(c => c.AssignedAdmin)
                            .FirstAsync(c => c.Id == existing.Id);
                    }
                    else
                    {
                        var assignedId = await PickNextAdminIdAsync();
                        conv = new ChatConversation
                        {
                            Id = Guid.NewGuid(),
                            LearnerId = senderId,
                            AssignedAdminId = assignedId,
                            CreatedAt = DateTime.UtcNow,
                            LastMessageAt = DateTime.UtcNow
                        };
                        _db.ChatConversations.Add(conv);
                        await _db.SaveChangesAsync();

                        conv = await _db.ChatConversations
                            .Include(c => c.Learner)
                            .Include(c => c.AssignedAdmin)
                            .FirstAsync(c => c.Id == conv.Id);
                    }
                }
            }

            var msg = new ChatMessage
            {
                Id = Guid.NewGuid(),
                ConversationId = conv.Id,
                SenderId = senderId,
                Content = content,
                SentAt = DateTime.UtcNow
            };
            _db.ChatMessages.Add(msg);
            conv.LastMessageAt = msg.SentAt;
            await _db.SaveChangesAsync();

            await _db.Entry(msg).Reference(m => m.Sender).LoadAsync();
            var isAdminSender = await _userManager.IsInRoleAsync(msg.Sender!, SD.Role_Admin);

            var messageDto = new ChatMessageDto
            {
                Id = msg.Id,
                ConversationId = conv.Id,
                SenderId = msg.SenderId,
                SenderName = msg.Sender?.FullName ?? "",
                IsFromAdmin = isAdminSender,
                Content = msg.Content,
                SentAt = msg.SentAt
            };

            var preview = new ChatConversationListItemDto
            {
                Id = conv.Id,
                LearnerId = conv.LearnerId,
                LearnerName = conv.Learner?.FullName ?? "",
                LearnerEmail = conv.Learner?.Email ?? "",
                AssignedAdminId = conv.AssignedAdminId,
                AssignedAdminName = conv.AssignedAdmin?.FullName ?? "",
                LastMessagePreview = content.Length > 120 ? content[..120] + "…" : content,
                LastMessageAt = conv.LastMessageAt,
                CreatedAt = conv.CreatedAt
            };

            return new SendChatMessageResultDto
            {
                Message = messageDto,
                ConversationId = conv.Id,
                ConversationPreview = preview
            };
        }

        private async Task<string> PickNextAdminIdAsync()
        {
            var admins = (await _userManager.GetUsersInRoleAsync(SD.Role_Admin))
                .OrderBy(u => u.Id)
                .ToList();

            if (admins.Count == 0)
                throw new InvalidOperationException("Chưa có tài khoản Admin nào để phân phiên (Round Robin).");

            await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            var state = await _db.ChatRoundRobinStates.FindAsync(1);
            if (state == null)
            {
                state = new ChatRoundRobinState { Id = 1, LastAssignedIndex = -1 };
                _db.ChatRoundRobinStates.Add(state);
                await _db.SaveChangesAsync();
            }

            var nextIndex = (state.LastAssignedIndex + 1) % admins.Count;
            state.LastAssignedIndex = nextIndex;
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return admins[nextIndex].Id;
        }
    }
}
