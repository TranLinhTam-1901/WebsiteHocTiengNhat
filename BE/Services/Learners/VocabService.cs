using QuizzTiengNhat.Models;
using Microsoft.EntityFrameworkCore;

namespace QuizzTiengNhat.Services.Learners
{
    public class VocabService : IVocabService
    {
        private readonly ApplicationDbContext _context;

        public VocabService(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách từ vựng theo Topic (Kèm Kanji và Loại từ)
        public async Task<List<Vocabularies>> GetVocabsByTopicAsync(Guid topicId)
        {
            return await _context.Vocabularies
                .Include(v => v.JLPTLevel)
                .Include(v => v.VocabTopics)
                .Include(v => v.VocabWordTypes).ThenInclude(vw => vw.WordType)
                .Include(v => v.RelatedKanjis).ThenInclude(vk => vk.Kanji)
                .Where(v => v.VocabTopics.Any(vt => vt.TopicID == topicId))
                .ToListAsync();
        }

        // 2. Query "Combo": Lấy chi tiết 1 từ vựng + tất cả ví dụ + Kanji liên quan
        public async Task<object> GetFullVocabDetailAsync(Guid vocabId)
        {
            return await _context.Vocabularies
                .Include(v => v.Examples)
                .Include(v => v.RelatedKanjis).ThenInclude(rk => rk.Kanji)
                .Include(v => v.VocabWordTypes).ThenInclude(vw => vw.WordType)
                .Select(v => new {
                    v.VocabID,
                    v.Word,
                    v.Reading,
                    v.Meaning,
                    v.AudioURL,
                    v.ImageURL,
                    v.Mnemonics,
                    // Lấy danh sách loại từ (Danh từ, Động từ...)
                    WordTypes = v.VocabWordTypes.Select(wt => wt.WordType.Name),
                    // Lấy danh sách Kanji cấu thành nên từ đó
                    Kanjis = v.RelatedKanjis.Select(rk => new {
                        rk.Kanji.Character,
                        rk.Kanji.Meaning
                    }),
                    Examples = v.Examples.Select(ex => new {
                        ex.Content,
                        ex.Translation,
                        ex.AudioURL
                    })
                })
                .FirstOrDefaultAsync(v => v.VocabID == vocabId);
        }

        // 3. Query Cá nhân hóa: Lấy từ vựng theo Loại từ (Ví dụ: Chỉ lấy Động từ nhóm 1)
        public async Task<List<Vocabularies>> GetVocabsByWordTypeAsync(string typeName)
        {
            return await _context.Vocabularies
                .Include(v => v.VocabWordTypes).ThenInclude(vw => vw.WordType)
                .Where(v => v.VocabWordTypes.Any(vw => vw.WordType.Name == typeName))
                .ToListAsync();
        }
    }
}