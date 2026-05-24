using Microsoft.AspNetCore.SignalR;
using QuizzTiengNhat.Services;
using System.Security.Claims;

namespace QuizzTiengNhat.Hubs
{
    public class PresenceHub : Hub
    {
        private readonly IBrowserSessionHubCoordinator _sessionCoordinator;

        public PresenceHub(IBrowserSessionHubCoordinator sessionCoordinator)
        {
            _sessionCoordinator = sessionCoordinator;
        }

        public override async Task OnConnectedAsync()
        {
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
            {
                await base.OnConnectedAsync();
                return;
            }

            var roles = Context.User?.FindAll(ClaimTypes.Role).Select(r => r.Value.ToLower()).ToList() ?? new List<string>();
            var isAdmin = roles.Any(r => r == "admin" || r == "administrator");

            var browserId = Context.GetHttpContext()?.Request.Query["browserId"].FirstOrDefault() ?? string.Empty;
            _sessionCoordinator.RegisterConnection(email, Context.ConnectionId, "presence", browserId, isAdmin);

            await SendUpdateCount();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
                _sessionCoordinator.UnregisterConnection(email, Context.ConnectionId);

            await SendUpdateCount();
            await base.OnDisconnectedAsync(exception);
        }

        private async Task SendUpdateCount()
        {
            var count = _sessionCoordinator.GetOnlineLearnerCount();
            await Clients.All.SendAsync("UpdateOnlineCount", count);
        }
    }
}
