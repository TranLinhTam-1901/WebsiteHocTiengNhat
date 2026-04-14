public class DashboardProgressDTO
{
    public double TotalPercent { get; set; }
    public ProgressDetail CourseProgress { get; set; }
    public ProgressDetail SkillProgress { get; set; }
    public string CurrentLevelName { get; set; }
}