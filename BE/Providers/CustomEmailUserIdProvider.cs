using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace QuizzTiengNhat.Providers
{
    public class CustomEmailUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst(ClaimTypes.Email)?.Value;
        }
    }
}
