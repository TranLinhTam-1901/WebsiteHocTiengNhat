using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Admin.Dashboard;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Admins;

public class AdminDashboardService : IAdminDashboardService
{
    private const int MinAttemptsForTopWrong = 3;
    private const int RecentLearnersLimit = 8;
    private const int TopWrongQuestionsLimit = 5;

    private static readonly Dictionary<SkillType, string> SkillLabelsVi = new()
    {
        { SkillType.General, "Tổng hợp" },
        { SkillType.Vocabulary, "Từ vựng" },
        { SkillType.Grammar, "Ngữ pháp" },
        { SkillType.Kanji, "Hán tự" },
        { SkillType.Reading, "Đọc hiểu" },
        { SkillType.Listening, "Nghe hiểu" },
        { SkillType.Practice, "Luyện tập" },
    };

    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IBrowserSessionHubCoordinator _sessionCoordinator;

    public AdminDashboardService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IBrowserSessionHubCoordinator sessionCoordinator)
    {
        _context = context;
        _userManager = userManager;
        _sessionCoordinator = sessionCoordinator;
    }

    public async Task<AdminDashboardOverviewDTO> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var learnerIds = await GetLearnerUserIdsAsync(cancellationToken);
        var utcNow = DateTime.UtcNow;
        var today = utcNow.Date;
        var rangeStart = today.AddDays(-6);
        var prevRangeStart = today.AddDays(-13);
        var prevRangeEnd = rangeStart;

        var summary = await BuildSummaryAsync(learnerIds, rangeStart, prevRangeStart, prevRangeEnd, cancellationToken);

        return new AdminDashboardOverviewDTO
        {
            Summary = summary,
            ActivityLast7Days = await BuildActivityChartAsync(rangeStart, today, cancellationToken),
            LearnersByLevel = await BuildLearnersByLevelAsync(learnerIds, cancellationToken),
            TopWrongQuestions = await BuildTopWrongQuestionsAsync(cancellationToken),
            RecentActiveLearners = await BuildRecentLearnersAsync(learnerIds, cancellationToken),
            ContentStats = await BuildContentStatsAsync(cancellationToken),
            GeneratedAt = utcNow,
        };
    }

    private async Task<List<string>> GetLearnerUserIdsAsync(CancellationToken cancellationToken)
    {
        var learners = await _userManager.GetUsersInRoleAsync(SD.Role_Learner);
        return learners.Select(u => u.Id).ToList();
    }

    private async Task<AdminDashboardSummaryDTO> BuildSummaryAsync(
        List<string> learnerIds,
        DateTime rangeStart,
        DateTime prevRangeStart,
        DateTime prevRangeEnd,
        CancellationToken cancellationToken)
    {
        var totalLearners = learnerIds.Count;
        var onlineLearners = _sessionCoordinator.GetOnlineLearnerCount();

        var lockedLearners = 0;
        if (learnerIds.Count > 0)
        {
            lockedLearners = await _context.Users
                .AsNoTracking()
                .Where(u => learnerIds.Contains(u.Id)
                            && u.LockoutEnd.HasValue
                            && u.LockoutEnd > DateTimeOffset.UtcNow)
                .CountAsync(cancellationToken);
        }

        var averagePassRate = await ComputeAveragePassRateAsync(learnerIds, cancellationToken);
        var averageLessonProgress = await ComputeAverageLessonProgressAsync(learnerIds, cancellationToken);

        var activeLast7 = await CountActiveLearnersInRangeAsync(learnerIds, rangeStart, DateTime.UtcNow, cancellationToken);
        var activePrev7 = await CountActiveLearnersInRangeAsync(learnerIds, prevRangeStart, prevRangeEnd, cancellationToken);

        double? trend = null;
        if (activePrev7 > 0)
            trend = Math.Round((activeLast7 - activePrev7) * 100.0 / activePrev7, 1);
        else if (activeLast7 > 0)
            trend = 100;

        return new AdminDashboardSummaryDTO
        {
            TotalLearners = totalLearners,
            OnlineLearners = onlineLearners,
            LockedLearners = lockedLearners,
            AveragePassRatePercent = averagePassRate,
            AverageLessonProgressPercent = averageLessonProgress,
            ActiveLearnersLast7Days = activeLast7,
            ActivityTrendPercent = trend,
        };
    }

    private async Task<double> ComputeAveragePassRateAsync(List<string> learnerIds, CancellationToken cancellationToken)
    {
        if (learnerIds.Count == 0) return 0;

        var results = await _context.Exam_Results
            .AsNoTracking()
            .Include(r => r.Exam)
            .Where(r => learnerIds.Contains(r.UserID))
            .Select(r => new { r.Score, r.Exam.PassingScore })
            .ToListAsync(cancellationToken);

        if (results.Count == 0) return 0;

        var passed = results.Count(r => r.Score >= (double)r.PassingScore);
        return Math.Round(passed * 100.0 / results.Count, 1);
    }

    private async Task<double> ComputeAverageLessonProgressAsync(List<string> learnerIds, CancellationToken cancellationToken)
    {
        if (learnerIds.Count == 0) return 0;

        var progressQuery = _context.Progresses.AsNoTracking().Where(p => learnerIds.Contains(p.UserID));
        var total = await progressQuery.CountAsync(cancellationToken);
        if (total == 0) return 0;

        var completed = await progressQuery.CountAsync(p => p.Status == "Completed", cancellationToken);
        return Math.Round(completed * 100.0 / total, 1);
    }

    private async Task<int> CountActiveLearnersInRangeAsync(
        List<string> learnerIds,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken)
    {
        if (learnerIds.Count == 0) return 0;

        var fromProgress = await _context.Progresses
            .AsNoTracking()
            .Where(p => learnerIds.Contains(p.UserID) && p.LastAccessed >= from && p.LastAccessed < to)
            .Select(p => p.UserID)
            .Distinct()
            .ToListAsync(cancellationToken);

        var fromExams = await _context.Exam_Results
            .AsNoTracking()
            .Where(r => learnerIds.Contains(r.UserID) && r.CreatedAt >= from && r.CreatedAt < to)
            .Select(r => r.UserID)
            .Distinct()
            .ToListAsync(cancellationToken);

        var fromSessions = await _context.Exam_Sessions
            .AsNoTracking()
            .Where(s => learnerIds.Contains(s.UserID) && s.StartedAt >= from && s.StartedAt < to)
            .Select(s => s.UserID)
            .Distinct()
            .ToListAsync(cancellationToken);

        return fromProgress.Union(fromExams).Union(fromSessions).Distinct().Count();
    }

    private async Task<List<AdminActivityDayDTO>> BuildActivityChartAsync(
        DateTime rangeStart,
        DateTime today,
        CancellationToken cancellationToken)
    {
        var rangeEnd = today.AddDays(1);
        var dayLabels = new[] { "T2", "T3", "T4", "T5", "T6", "T7", "CN" };

        var sessionGroups = await _context.Exam_Sessions
            .AsNoTracking()
            .Where(s => s.StartedAt >= rangeStart && s.StartedAt < rangeEnd)
            .GroupBy(s => s.StartedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var progressGroups = await _context.Progresses
            .AsNoTracking()
            .Where(p => p.LastAccessed >= rangeStart && p.LastAccessed < rangeEnd)
            .GroupBy(p => p.LastAccessed.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var sessionMap = sessionGroups.ToDictionary(x => x.Date, x => x.Count);
        var progressMap = progressGroups.ToDictionary(x => x.Date, x => x.Count);

        var days = new List<AdminActivityDayDTO>();
        for (var i = 0; i < 7; i++)
        {
            var date = rangeStart.AddDays(i);
            days.Add(new AdminActivityDayDTO
            {
                Date = date,
                Label = dayLabels[((int)date.DayOfWeek + 6) % 7],
                ExamSessions = sessionMap.GetValueOrDefault(date),
                LessonAccesses = progressMap.GetValueOrDefault(date),
            });
        }

        return days;
    }

    private async Task<List<AdminLevelDistributionDTO>> BuildLearnersByLevelAsync(
        List<string> learnerIds,
        CancellationToken cancellationToken)
    {
        if (learnerIds.Count == 0) return new List<AdminLevelDistributionDTO>();

        var grouped = await _context.Users
            .AsNoTracking()
            .Include(u => u.Level)
            .Where(u => learnerIds.Contains(u.Id))
            .GroupBy(u => new { u.LevelID, LevelName = u.Level != null ? u.Level.LevelName : "Chưa chọn" })
            .Select(g => new AdminLevelDistributionDTO
            {
                LevelId = g.Key.LevelID,
                LevelName = g.Key.LevelName,
                LearnerCount = g.Count(),
            })
            .OrderByDescending(x => x.LearnerCount)
            .ToListAsync(cancellationToken);

        return grouped;
    }

    private async Task<List<AdminTopWrongQuestionDTO>> BuildTopWrongQuestionsAsync(CancellationToken cancellationToken)
    {
        var aggregates = await _context.Exam_Result_Details
            .AsNoTracking()
            .GroupBy(d => d.QuestionID)
            .Select(g => new
            {
                QuestionId = g.Key,
                Total = g.Count(),
                Wrong = g.Count(x => !x.IsCorrect),
            })
            .Where(x => x.Total >= MinAttemptsForTopWrong)
            .ToListAsync(cancellationToken);

        if (aggregates.Count == 0) return new List<AdminTopWrongQuestionDTO>();

        var topIds = aggregates
            .Select(x => new
            {
                x.QuestionId,
                x.Total,
                WrongRate = x.Total > 0 ? x.Wrong * 100.0 / x.Total : 0,
            })
            .OrderByDescending(x => x.WrongRate)
            .ThenByDescending(x => x.Total)
            .Take(TopWrongQuestionsLimit)
            .ToList();

        var questionIds = topIds.Select(x => x.QuestionId).ToList();
        var questions = await _context.Questions
            .AsNoTracking()
            .Include(q => q.Lesson)
                .ThenInclude(l => l!.Course)
                    .ThenInclude(c => c.Level)
            .Where(q => questionIds.Contains(q.QuestionID))
            .ToListAsync(cancellationToken);

        var questionMap = questions.ToDictionary(q => q.QuestionID);

        return topIds.Select(item =>
        {
            questionMap.TryGetValue(item.QuestionId, out var q);
            var skill = q?.SkillType ?? SkillType.Vocabulary;
            var content = q?.Content ?? "(Đã xóa)";
            if (content.Length > 120) content = content[..117] + "...";

            return new AdminTopWrongQuestionDTO
            {
                QuestionId = item.QuestionId,
                Content = content,
                LevelName = q?.Lesson?.Course?.Level?.LevelName ?? "—",
                SkillType = skill.ToString(),
                SkillTypeLabel = SkillLabelsVi.GetValueOrDefault(skill, skill.ToString()),
                WrongRatePercent = Math.Round(item.WrongRate, 1),
                AttemptCount = aggregates.First(a => a.QuestionId == item.QuestionId).Total,
            };
        }).ToList();
    }

    private async Task<List<AdminRecentLearnerDTO>> BuildRecentLearnersAsync(
        List<string> learnerIds,
        CancellationToken cancellationToken)
    {
        if (learnerIds.Count == 0) return new List<AdminRecentLearnerDTO>();

        var progressMax = await _context.Progresses
            .AsNoTracking()
            .Where(p => learnerIds.Contains(p.UserID))
            .GroupBy(p => p.UserID)
            .Select(g => new { UserId = g.Key, LastAt = g.Max(p => p.LastAccessed) })
            .ToListAsync(cancellationToken);

        var examMax = await _context.Exam_Results
            .AsNoTracking()
            .Where(r => learnerIds.Contains(r.UserID))
            .GroupBy(r => r.UserID)
            .Select(g => new { UserId = g.Key, LastAt = g.Max(r => r.CreatedAt) })
            .ToListAsync(cancellationToken);

        var lastByUser = new Dictionary<string, DateTime>();
        foreach (var p in progressMax)
            lastByUser[p.UserId] = p.LastAt;
        foreach (var e in examMax)
        {
            if (!lastByUser.TryGetValue(e.UserId, out var existing) || e.LastAt > existing)
                lastByUser[e.UserId] = e.LastAt;
        }

        var topUserIds = lastByUser
            .OrderByDescending(kv => kv.Value)
            .Take(RecentLearnersLimit)
            .Select(kv => kv.Key)
            .ToList();

        if (topUserIds.Count == 0)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Level)
                .Where(u => learnerIds.Contains(u.Id))
                .OrderBy(u => u.FullName)
                .Take(RecentLearnersLimit)
                .Select(u => new AdminRecentLearnerDTO
                {
                    UserId = u.Id,
                    FullName = u.FullName,
                    Email = u.Email ?? "",
                    LevelName = u.Level != null ? u.Level.LevelName : "Chưa chọn",
                    LastActivityAt = null,
                    CompletedLessons = 0,
                })
                .ToListAsync(cancellationToken);
        }

        var completedMap = await _context.Progresses
            .AsNoTracking()
            .Where(p => topUserIds.Contains(p.UserID) && p.Status == "Completed")
            .GroupBy(p => p.UserID)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, cancellationToken);

        var users = await _context.Users
            .AsNoTracking()
            .Include(u => u.Level)
            .Where(u => topUserIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        return topUserIds
            .Select(id =>
            {
                var u = users.First(x => x.Id == id);
                lastByUser.TryGetValue(id, out var lastAt);
                return new AdminRecentLearnerDTO
                {
                    UserId = u.Id,
                    FullName = u.FullName,
                    Email = u.Email ?? "",
                    LevelName = u.Level?.LevelName ?? "Chưa chọn",
                    LastActivityAt = lastAt == default ? null : lastAt,
                    CompletedLessons = completedMap.GetValueOrDefault(id),
                };
            })
            .ToList();
    }

    private async Task<AdminContentStatsDTO> BuildContentStatsAsync(CancellationToken cancellationToken)
    {
        return new AdminContentStatsDTO
        {
            Questions = await _context.Questions.CountAsync(cancellationToken),
            PublishedExams = await _context.Exams.CountAsync(e => e.IsPublished, cancellationToken),
            Lessons = await _context.Lessons.CountAsync(cancellationToken),
            Vocabularies = await _context.Vocabularies.CountAsync(cancellationToken),
        };
    }
}
