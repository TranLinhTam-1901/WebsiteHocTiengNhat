using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Helpers;
using QuizzTiengNhat.Models;
using System.Net.NetworkInformation;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/vocabulary")]
    [Authorize(Roles = "Admin")]
    public class VocabularyAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public VocabularyAdminController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetVocabularies()
        {
            var vocabs = await _context.Vocabularies
                .Include(v => v.JLPTLevel)
                .Include(v => v.Topic)
                .OrderByDescending(v => v.UpdatedAt)
                .Select(v => new
                {
                    vocabID = v.VocabID,
                    word = v.Word,
                    reading = v.Reading,
                    meaning = v.Meaning,
                    wordType = v.WordType,
                    isCommon = v.IsCommon,
                    status = v.Status,
                    levelName = v.JLPTLevel != null ? v.JLPTLevel.LevelName : "N/A",
                    topicName = v.Topic != null ? v.Topic.TopicName : "N/A",
                    updatedAt = v.UpdatedAt
                })
                .ToListAsync();

            return Ok(vocabs);
        }

        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var v = await _context.Vocabularies
                .Include(v => v.Examples)
                .Include(v => v.RelatedKanjis).ThenInclude(rk => rk.Kanji)
                .FirstOrDefaultAsync(v => v.VocabID == id);

            if (v == null) return NotFound("Không tìm thấy từ vựng.");

            return Ok(new
            {
                word = v.Word,
                reading = v.Reading,
                meaning = v.Meaning,
                wordType = v.WordType,
                isCommon = v.IsCommon,
                mnemonics = v.Mnemonics,
                imageURL = v.ImageURL,
                audioURL = v.AudioURL,
                priority = v.Priority,
                status = v.Status,
                levelID = v.LevelID,
                topicID = v.TopicID,
                lessonID = v.LessonID,
                examples = v.Examples.Select(e => new { e.Content, e.Translation }),
                relatedKanjiIDs = v.RelatedKanjis.Select(rk => rk.KanjiID).ToList()
            });
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateVocabDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Xử lý Files
                string audioPath = !string.IsNullOrEmpty(dto.AudioURL)
                    ? await FileHelper.SaveBase64Image(dto.AudioURL, "vocab-audios", dto.Word, _env.WebRootPath) : null;
                string imagePath = !string.IsNullOrEmpty(dto.ImageURL)
                    ? await FileHelper.SaveBase64Image(dto.ImageURL, "vocab-images", dto.Word, _env.WebRootPath) : null;

                // 2. Tạo Vocab
                var vocab = new Vocabularies
                {
                    VocabID = Guid.NewGuid(),
                    Word = dto.Word,
                    Reading = dto.Reading,
                    Meaning = dto.Meaning,
                    WordType = dto.WordType,
                    IsCommon = dto.IsCommon,
                    Mnemonics = dto.Mnemonics,
                    AudioURL = audioPath,
                    ImageURL = imagePath,
                    Priority = dto.Priority,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    TopicID = dto.TopicID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Vocabularies.Add(vocab);

                // 3. Thêm Ví dụ
                if (dto.Examples != null)
                {
                    foreach (var ex in dto.Examples)
                    {
                        _context.Examples.Add(new Examples
                        {
                            ExampleID = Guid.NewGuid(),
                            Content = ex.Content,
                            Translation = ex.Translation,
                            VocabID = vocab.VocabID
                        });
                    }
                }

                // 4. Liên kết Kanji
                if (dto.RelatedKanjiIDs != null)
                {
                    foreach (var kanjiId in dto.RelatedKanjiIDs)
                    {
                        _context.VocabularyKanjis.Add(new VocabularyKanjis
                        {
                            VocabID = vocab.VocabID,
                            KanjiID = kanjiId
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Thêm từ vựng thành công", id = vocab.VocabID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateVocabDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var vocab = await _context.Vocabularies
                    .Include(v => v.Examples)
                    .Include(v => v.RelatedKanjis)
                    .FirstOrDefaultAsync(v => v.VocabID == id);

                if (vocab == null) return NotFound("Không tìm thấy từ vựng.");

                // --- XỬ LÝ AUDIO ---
                // Nếu dto.AudioURL là chuỗi Base64 (bắt đầu bằng data:audio...) thì mới lưu file mới
                if (!string.IsNullOrEmpty(dto.AudioURL) && dto.AudioURL.Contains("base64,"))
                {
                    // (Có thể thêm logic xóa file cũ tại vocab.AudioURL ở đây nếu muốn)
                    vocab.AudioURL = await FileHelper.SaveBase64Image(dto.AudioURL, "vocab-audios", dto.Word, _env.WebRootPath);
                }
                // Nếu dto.AudioURL trống, nghĩa là người dùng xóa audio
                else if (string.IsNullOrEmpty(dto.AudioURL))
                {
                    vocab.AudioURL = null;
                }
                // Nếu là URL cũ (không chứa base64) thì giữ nguyên vocab.AudioURL, không làm gì cả.

                // --- XỬ LÝ ẢNH ---
                if (!string.IsNullOrEmpty(dto.ImageURL) && dto.ImageURL.Contains("base64,"))
                {
                    vocab.ImageURL = await FileHelper.SaveBase64Image(dto.ImageURL, "vocab-images", dto.Word, _env.WebRootPath);
                }
                else if (string.IsNullOrEmpty(dto.ImageURL))
                {
                    vocab.ImageURL = null;
                }

                // --- CẬP NHẬT THÔNG TIN CƠ BẢN ---
                vocab.Word = dto.Word;
                vocab.Reading = dto.Reading;
                vocab.Meaning = dto.Meaning;
                vocab.WordType = dto.WordType;
                vocab.IsCommon = dto.IsCommon;
                vocab.Mnemonics = dto.Mnemonics;
                vocab.Priority = dto.Priority;
                vocab.Status = dto.Status;
                vocab.LevelID = dto.LevelID;
                vocab.TopicID = dto.TopicID;
                vocab.LessonID = dto.LessonID;
                vocab.UpdatedAt = DateTime.UtcNow;

                // --- XỬ LÝ EXAMPLES & KANJI LINKS (Dữ liệu quan hệ) ---
                _context.Examples.RemoveRange(vocab.Examples);
                _context.VocabularyKanjis.RemoveRange(vocab.RelatedKanjis);

                if (dto.Examples != null)
                {
                    foreach (var ex in dto.Examples)
                    {
                        _context.Examples.Add(new Examples
                        {
                            ExampleID = Guid.NewGuid(),
                            Content = ex.Content,
                            Translation = ex.Translation,
                            VocabID = id
                        });
                    }
                }

                if (dto.RelatedKanjiIDs != null)
                {
                    foreach (var kanjiId in dto.RelatedKanjiIDs)
                    {
                        _context.VocabularyKanjis.Add(new VocabularyKanjis
                        {
                            VocabID = id,
                            KanjiID = kanjiId
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi: {ex.Message}");
            }
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var vocab = await _context.Vocabularies.FindAsync(id);
            if (vocab == null) return NotFound();

            // EF Core sẽ tự động xóa các Examples và VocabularyKanjis liên quan nếu bạn cài Cascade Delete
            _context.Vocabularies.Remove(vocab);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa từ vựng" });
        }

        // --- Metadata Methods ---
        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() => Ok(await _context.JLPT_Levels.Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() => Ok(await _context.Topics.Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons() => Ok(await _context.Lessons.Select(l => new { id = l.LessonID, name = l.Title }).ToListAsync());
    }
}