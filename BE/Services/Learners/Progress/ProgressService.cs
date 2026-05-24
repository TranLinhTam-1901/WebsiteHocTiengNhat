using QuizzTiengNhat.Models;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner.Progress;
public class ProgressService : IProgressService
{
    private readonly ApplicationDbContext _context;

    public ProgressService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardProgressDTO> CalculateGlobalProgressAsync(string userId)
    {
        // 1. Lấy thông tin Level hiện tại của User
        var user = await _context.Users
            .Include(u => u.Level)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.LevelID == null) 
            return new DashboardProgressDTO { CurrentLevelName = "Chưa chọn cấp độ" };

        // ====== PHƯƠNG ÁN A: CÔNG THỨC CÂN BẰNG (35% + 35% + 20% + 10%) ======
        // Progress = (Lesson × 0.35) + (ExamPass × 0.35) + (ExamScore × 0.20) + (Flashcard × 0.10)

        // 1. LESSON COMPLETION (35%)
        var totalLessons = await _context.Lessons
            .CountAsync(l => l.Course.LevelID == user.LevelID);

        var completedLessons = await _context.Progresses
            .CountAsync(p => p.UserID == userId 
                          && p.Lesson.Course.LevelID == user.LevelID 
                          && p.Status == "Completed");

        double lessonRatio = totalLessons > 0 ? (double)completedLessons / totalLessons : 0;

        // 2. EXAM PASS RATE (35%) - ← NEW
        var totalExams = await _context.Exams
            .CountAsync(e => e.LevelID == user.LevelID 
                            && e.IsPublished
                            && e.Type != 0);

        var passedExams = await _context.Exam_Results.AsNoTracking()
            .Where(r => r.User.Id == userId 
                          && r.Exam.LevelID == user.LevelID
                          && r.Exam.Type != 0
                          && r.Score >= (double)r.Exam.PassingScore)
                        .Select(r => r.ExamID)
                        .Distinct()
                        .CountAsync();

        double passRate = totalExams > 0 ? (double)passedExams / totalExams : 0;

        // 3. EXAM AVERAGE SCORE (20%) - ← NEW
        var avgScore = await _context.Exam_Results.AsNoTracking()
            .Where(r => r.User.Id == userId 
                && r.Exam.LevelID == user.LevelID
                && r.Exam.Type != 0)
                
            .AverageAsync(r => (double?)r.Score) ?? 0;
        
        // Normalize score 
        double scoreRatio = avgScore / 10.0;

        // 4. FLASHCARD MASTERY (10%)
        var totalFlashcards = await _context.FlashcardItems
            .CountAsync(i => i.Deck.UserID == userId);

        var masteredFlashcards = await _context.FlashcardItems
            .CountAsync(i => i.Deck.UserID == userId && i.IsMastered);

        double flashcardRatio = totalFlashcards > 0 ? (double)masteredFlashcards / totalFlashcards : 0;

        // ====== CÔNG THỨC CUỐI: 35% + 35% + 20% + 10% ======
        double totalPercent = (lessonRatio * 0.35) 
                            + (passRate * 0.35) 
                            + (scoreRatio * 0.20) 
                            + (flashcardRatio * 0.10);
        
        // Convert to percentage (0-1 → 0-100)
        totalPercent *= 100;

        return new DashboardProgressDTO
        {
            CurrentLevelName = user.Level?.LevelName ?? "N/A",
            TotalPercent = Math.Round(totalPercent, 1),
            
            // Lesson Progress (35%)
            CourseProgress = new ProgressDetail 
            { 
                Total = totalLessons, 
                Completed = completedLessons, 
                Percentage = Math.Round(lessonRatio * 100, 1) 
            },
            
            // Exam Progress (35% + 20%)
            ExamProgress = new ExamProgressDTO
            {
                TotalExams = totalExams,
                PassedExams = passedExams,
                PassRate = Math.Round(passRate * 100, 1),
                AverageScore = Math.Round(avgScore, 1)
            },
            
            // Flashcard Progress (10%)
            SkillProgress = new ProgressDetail 
            { 
                Total = totalFlashcards, 
                Completed = masteredFlashcards, 
                Percentage = Math.Round(flashcardRatio * 100, 1) 
            }
        };
    }
}