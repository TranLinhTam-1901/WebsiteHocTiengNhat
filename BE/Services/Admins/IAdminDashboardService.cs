using QuizzTiengNhat.DTOs.Admin.Dashboard;

namespace QuizzTiengNhat.Services.Admins;

public interface IAdminDashboardService
{
    Task<AdminDashboardOverviewDTO> GetOverviewAsync(CancellationToken cancellationToken = default);
}
