using QuizzTiengNhat.Models;
using Microsoft.EntityFrameworkCore;

namespace QuizzTiengNhat.Services.Learners
{
    public class GrammarService : IGrammarService
    {
        private readonly ApplicationDbContext _context;

        public GrammarService(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy ngữ pháp theo Nhóm (Ví dụ: Nhóm câu điều kiện)
        public async Task<List<Grammars>> GetGrammarsByGroupAsync(Guid groupId)
        {
            return await _context.Grammars
                .Include(g => g.Examples)
                .Where(g => g.GrammarGroupID == groupId)
                .ToListAsync();
        }

        // 2. Lấy ngữ pháp theo Topic (Sử dụng bảng trung gian GrammarTopics)
        public async Task<List<Grammars>> GetGrammarsByTopicAsync(Guid topicId)
        {
            return await _context.Grammars
                .Include(g => g.GrammarGroup)
                .Include(g => g.Examples)
                .Where(g => g.GrammarTopics.Any(gt => gt.TopicID == topicId))
                .ToListAsync();
        }
    }
}
