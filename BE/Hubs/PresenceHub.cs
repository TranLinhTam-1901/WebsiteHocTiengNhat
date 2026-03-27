using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Collections.Concurrent;

namespace QuizzTiengNhat.Hubs
{
    public class PresenceHub : Hub
    {
        // Lưu trữ: Email -> <ConnectionId, Thời gian>
        public static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, DateTime>> OnlineUsers =
            new ConcurrentDictionary<string, ConcurrentDictionary<string, DateTime>>();

        public static readonly ConcurrentDictionary<string, bool> UserRoles = new ConcurrentDictionary<string, bool>();

        public override async Task OnConnectedAsync()
        {
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email)) return;

            // Cập nhật Role
            var roles = Context.User?.FindAll(ClaimTypes.Role).Select(r => r.Value.ToLower()).ToList() ?? new List<string>();
            bool isAdmin = roles.Any(r => r == "admin" || r == "administrator");
            UserRoles.AddOrUpdate(email, isAdmin, (key, old) => isAdmin);

            // Thêm kết nối mới (Cho phép nhiều ConnectionId cho cùng 1 Email = Nhiều tab)
            var userConnections = OnlineUsers.GetOrAdd(email, _ => new ConcurrentDictionary<string, DateTime>());
            userConnections.TryAdd(Context.ConnectionId, DateTime.UtcNow);

            await SendUpdateCount();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                if (OnlineUsers.TryGetValue(email, out var connections))
                {
                    connections.TryRemove(Context.ConnectionId, out _);
                    if (connections.IsEmpty)
                    {
                        OnlineUsers.TryRemove(email, out _);
                        UserRoles.TryRemove(email, out _);
                    }
                }
            }

            await SendUpdateCount();
            await base.OnDisconnectedAsync(exception);
        }

        private async Task SendUpdateCount()
        {
            int count = OnlineUsers.Count(u => UserRoles.TryGetValue(u.Key, out bool isAdmin) && !isAdmin);
            await Clients.All.SendAsync("UpdateOnlineCount", count);
        }
    }
}