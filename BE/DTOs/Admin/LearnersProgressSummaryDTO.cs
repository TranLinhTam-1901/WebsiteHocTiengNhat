namespace QuizzTiengNhat.DTOs.Admin;

/// <summary>
/// Tổng hợp tiến độ trung bình học viên (Admin LearnerList KPI).
/// </summary>
public class LearnersProgressSummaryDTO
{
    /// <summary>Trung bình cộng TotalPercent của từng học viên (công thức 35/35/20/10).</summary>
    public double AverageProgressPercent { get; set; }

    public int TotalLearners { get; set; }

    /// <summary>Số học viên tham gia phép chia (thường bằng TotalLearners).</summary>
    public int IncludedInAverage { get; set; }

    /// <summary>Học viên chưa gán LevelID (TotalPercent thường = 0).</summary>
    public int LearnersWithoutLevel { get; set; }
}
