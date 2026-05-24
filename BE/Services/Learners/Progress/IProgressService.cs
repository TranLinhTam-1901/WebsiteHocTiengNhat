using QuizzTiengNhat.DTOs.Learner.Progress;
public interface IProgressService
{
    Task<DashboardProgressDTO> CalculateGlobalProgressAsync(string userId);
}