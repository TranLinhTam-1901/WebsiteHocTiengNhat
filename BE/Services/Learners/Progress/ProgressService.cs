using QuizzTiengNhat.Models;
using Microsoft.EntityFrameworkCore;
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

        // 2. TÍNH 70% TIẾN ĐỘ KHÓA HỌC (LESSONS)
        // Lấy tất cả bài học thuộc các khóa học có Level trùng với Level của User
        var totalLessons = await _context.Lessons
            .CountAsync(l => l.Course.LevelID == user.LevelID);

        // Đếm số bài học mà User đã hoàn thành (Status = Completed) trong Level đó
        var completedLessons = await _context.Progresses
            .CountAsync(p => p.UserID == userId 
                          && p.Lesson.Course.LevelID == user.LevelID 
                          && p.Status == "Completed");

        double courseRatio = totalLessons > 0 ? (double)completedLessons / totalLessons : 0;

        // 3. TÍNH 30% TIẾN ĐỘ KỸ NĂNG (FLASHCARDS)
        // Truy vấn trực tiếp từ bảng FlashcardItem thông qua các Deck của User
        var totalItems = await _context.FlashcardItems
            .CountAsync(i => i.Deck.UserID == userId);

        var masteredItems = await _context.FlashcardItems
            .CountAsync(i => i.Deck.UserID == userId && i.IsMastered);

        double skillRatio = totalItems > 0 ? (double)masteredItems / totalItems : 0;

        // 4. TỔNG HỢP THEO TRỌNG SỐ 70/30
        // Công thức: (Course % * 0.7) + (Skill % * 0.3)
        double totalPercent = (courseRatio * 70) + (skillRatio * 30);

        return new DashboardProgressDTO
        {
            CurrentLevelName = user.Level?.LevelName ?? "N/A",
            TotalPercent = Math.Round(totalPercent, 1),
            CourseProgress = new ProgressDetail 
            { 
                Total = totalLessons, 
                Completed = completedLessons, 
                Percentage = Math.Round(courseRatio * 100, 1) 
            },
            SkillProgress = new ProgressDetail 
            { 
                Total = totalItems, 
                Completed = masteredItems, 
                Percentage = Math.Round(skillRatio * 100, 1) 
            }
        };
    }
}