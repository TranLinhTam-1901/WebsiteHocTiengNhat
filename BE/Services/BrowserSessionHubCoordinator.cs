using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using QuizzTiengNhat.Hubs;

namespace QuizzTiengNhat.Services
{
    public sealed class BrowserSessionHubCoordinator : IBrowserSessionHubCoordinator
    {
        private static readonly StringComparer EmailComparer = StringComparer.OrdinalIgnoreCase;

        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ConnectionRegistration>> _byEmail =
            new(EmailComparer);

        private sealed record ConnectionRegistration(string HubKind, string BrowserSessionId, bool IsAdmin);

        public void RegisterConnection(string email, string connectionId, string hubKind, string browserSessionId, bool isAdmin)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(connectionId))
                return;

            var browser = browserSessionId ?? string.Empty;
            var inner = _byEmail.GetOrAdd(email, _ => new ConcurrentDictionary<string, ConnectionRegistration>());
            inner[connectionId] = new ConnectionRegistration(hubKind, browser, isAdmin);
        }

        public void UnregisterConnection(string email, string connectionId)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(connectionId))
                return;

            if (_byEmail.TryGetValue(email, out var inner) && inner.TryRemove(connectionId, out _) && inner.IsEmpty)
                _byEmail.TryRemove(email, out _);
        }

        public int GetOnlineLearnerCount()
        {
            var n = 0;
            foreach (var kv in _byEmail)
            {
                if (kv.Value.Values.Any(r => !r.IsAdmin))
                    n++;
            }

            return n;
        }

        public async Task NotifyNewLoginKickOthersAsync(
            string email,
            string? newBrowserSessionId,
            IHubContext<PresenceHub> presenceHub,
            IHubContext<ChatHub> chatHub,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(email))
                return;

            if (!_byEmail.TryGetValue(email, out var connections) || connections.IsEmpty)
                return;

            var newId = newBrowserSessionId ?? string.Empty;
            const string msg = "Tài khoản đã đăng nhập ở trình duyệt khác.";

            List<KeyValuePair<string, ConnectionRegistration>> toKick;
            if (string.IsNullOrEmpty(newId))
            {
                toKick = connections.ToList();
            }
            else
            {
                toKick = connections
                    .Where(p => !string.Equals(p.Value.BrowserSessionId, newId, StringComparison.Ordinal))
                    .ToList();
            }

            foreach (var pair in toKick)
            {
                var connectionId = pair.Key;
                var reg = pair.Value;

                if (string.Equals(reg.HubKind, "presence", StringComparison.OrdinalIgnoreCase))
                    await presenceHub.Clients.Client(connectionId).SendAsync("ForceLogout", msg, cancellationToken);
                else if (string.Equals(reg.HubKind, "chat", StringComparison.OrdinalIgnoreCase))
                    await chatHub.Clients.Client(connectionId).SendAsync("ForceLogout", msg, cancellationToken);

                connections.TryRemove(connectionId, out _);
            }

            if (connections.IsEmpty)
                _byEmail.TryRemove(email, out _);
        }
    }
}
