namespace QuizzTiengNhat.DTOs.Admin.Dashboard;

public class AdminDashboardOverviewDTO
{
    public AdminDashboardSummaryDTO Summary { get; set; } = new();
    public List<AdminActivityDayDTO> ActivityLast7Days { get; set; } = new();
    public List<AdminLevelDistributionDTO> LearnersByLevel { get; set; } = new();
    public List<AdminTopWrongQuestionDTO> TopWrongQuestions { get; set; } = new();
    public List<AdminRecentLearnerDTO> RecentActiveLearners { get; set; } = new();
    public AdminContentStatsDTO ContentStats { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class AdminDashboardSummaryDTO
{
    public int TotalLearners { get; set; }
    public int OnlineLearners { get; set; }
    public int LockedLearners { get; set; }
    public double AveragePassRatePercent { get; set; }
    public double AverageLessonProgressPercent { get; set; }
    public int ActiveLearnersLast7Days { get; set; }
    public double? ActivityTrendPercent { get; set; }
}

public class AdminActivityDayDTO
{
    public string Label { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int ExamSessions { get; set; }
    public int LessonAccesses { get; set; }
}

public class AdminLevelDistributionDTO
{
    public Guid? LevelId { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public int LearnerCount { get; set; }
}

public class AdminTopWrongQuestionDTO
{
    public Guid QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string LevelName { get; set; } = string.Empty;
    public string SkillType { get; set; } = string.Empty;
    public string SkillTypeLabel { get; set; } = string.Empty;
    public double WrongRatePercent { get; set; }
    public int AttemptCount { get; set; }
}

public class AdminRecentLearnerDTO
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string LevelName { get; set; } = string.Empty;
    public DateTime? LastActivityAt { get; set; }
    public int CompletedLessons { get; set; }
}

public class AdminContentStatsDTO
{
    public int Questions { get; set; }
    public int PublishedExams { get; set; }
    public int Lessons { get; set; }
    public int Vocabularies { get; set; }
}
