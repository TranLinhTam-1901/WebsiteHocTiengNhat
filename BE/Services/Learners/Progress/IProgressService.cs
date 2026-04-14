public interface IProgressService
{
    Task<DashboardProgressDTO> CalculateGlobalProgressAsync(string userId);
}