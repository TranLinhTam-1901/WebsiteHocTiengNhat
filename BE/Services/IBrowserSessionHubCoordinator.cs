using Microsoft.AspNetCore.SignalR;
using QuizzTiengNhat.Hubs;

namespace QuizzTiengNhat.Services
{
    /// <summary>
    /// Theo dõi kết nối SignalR theo email + browserSessionId để chỉ cho phép một trình duyệt (profile)
    /// đăng nhập cùng lúc; nhiều tab cùng trình duyệt dùng chung id trong localStorage.
    /// </summary>
    public interface IBrowserSessionHubCoordinator
    {
        void RegisterConnection(string email, string connectionId, string hubKind, string browserSessionId, bool isAdmin);

        void UnregisterConnection(string email, string connectionId);

        int GetOnlineLearnerCount();

        /// <summary>
        /// Gửi ForceLogout tới mọi kết nối của email có browserSessionId khác <paramref name="newBrowserSessionId"/>.
        /// Nếu <paramref name="newBrowserSessionId"/> rỗng: coi như client cũ — đá toàn bộ kết nối đang theo dõi.
        /// </summary>
        Task NotifyNewLoginKickOthersAsync(
            string email,
            string? newBrowserSessionId,
            IHubContext<PresenceHub> presenceHub,
            IHubContext<ChatHub> chatHub,
            CancellationToken cancellationToken = default);
    }
}
