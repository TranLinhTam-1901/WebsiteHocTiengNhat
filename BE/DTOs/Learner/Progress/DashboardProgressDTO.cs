namespace QuizzTiengNhat.DTOs.Learner.Progress;

public class DashboardProgressDTO
{
    public double TotalPercent { get; set; }
    public ProgressDetail CourseProgress { get; set; }
    public ExamProgressDTO ExamProgress { get; set; } // ← NEW (Phương án A: 35%)
    public ProgressDetail SkillProgress { get; set; }
    public string CurrentLevelName { get; set; }
}