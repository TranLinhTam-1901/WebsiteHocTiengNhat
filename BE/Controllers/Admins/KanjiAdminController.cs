using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Helpers;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/kanji")]
    [Authorize(Roles = "Admin")]
    public class KanjiAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public KanjiAdminController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // 1. Lấy danh sách Kanji
        [HttpGet("get-all")]
        public async Task<IActionResult> GetKanjis()
        {
            var kanjis = await _context.Kanjis
                .Include(k => k.JLPTLevel)
                .OrderByDescending(k => k.UpdatedAt)
                .Select(k => new KanjiDTO
                {
                    Id = k.KanjiID,
                    Character = k.Character,
                    Meaning = k.Meaning,
                    Onyomi = k.Onyomi,
                    Kunyomi = k.Kunyomi,
                    StrokeCount = k.StrokeCount,
                    Radical = k.Radical,
                    Status = k.Status,
                    Popularity = k.Popularity,
                    LevelName = k.JLPTLevel != null ? k.JLPTLevel.LevelName : "N/A",
                    UpdatedAt = k.UpdatedAt
                })
                .ToListAsync();

            return Ok(kanjis);
        }

        // 2. Lấy chi tiết 1 Kanji (Map đầy đủ trường mới)
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var k = await _context.Kanjis
                .Include(k => k.RelatedVocabularies)
                    .ThenInclude(rv => rv.Vocabulary)
                .FirstOrDefaultAsync(k => k.KanjiID == id);

            if (k == null) return NotFound("Không tìm thấy Kanji.");

            return Ok(new
            {
                character = k.Character,
                onyomi = k.Onyomi,
                kunyomi = k.Kunyomi,
                meaning = k.Meaning,
                strokeCount = k.StrokeCount,
                strokeGif = k.StrokeGif,
                radical = k.Radical,
                mnemonics = k.Mnemonics,
                popularity = k.Popularity,
                note = k.Note,
                status = k.Status,
                levelID = k.LevelID,
                topicID = k.TopicID,
                lessonID = k.LessonID,
                relatedVocabs = k.RelatedVocabularies.Select(rv => new {
                    vocabID = rv.VocabID,
                    word = rv.Vocabulary.Word,
                    reading = rv.Vocabulary.Reading,
                    meaning = rv.Vocabulary.Meaning
                })
            });
        }

        // 3. Thêm mới Kanji
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateKanjiDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Xử lý File GIF (Lưu vào thư mục wwwroot/kanji-gifs)
                string imagePath = null;
                if (!string.IsNullOrEmpty(dto.StrokeGif))
                {
                    imagePath = await FileHelper.SaveBase64Image(dto.StrokeGif, "kanji-gifs", dto.Character, _env.WebRootPath);
                }

                // 2. Map dữ liệu từ DTO sang Model Kanji
                var kanji = new Kanjis
                {
                    KanjiID = Guid.NewGuid(),
                    Character = dto.Character,
                    Onyomi = dto.Onyomi,
                    Kunyomi = dto.Kunyomi,
                    Meaning = dto.Meaning,
                    StrokeCount = dto.StrokeCount,
                    Radical = dto.Radical,
                    StrokeGif = imagePath,
                    Mnemonics = dto.Mnemonics,
                    Popularity = dto.Popularity,
                    Note = dto.Note,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    TopicID = dto.TopicID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Kanjis.Add(kanji);

                // 3. XỬ LÝ LIÊN KẾT TỪ VỰNG (Dựa trên List<Guid>)
                if (dto.RelatedVocabIDs != null && dto.RelatedVocabIDs.Any())
                {
                    foreach (var vocabId in dto.RelatedVocabIDs)
                    {
                        _context.VocabularyKanjis.Add(new VocabularyKanjis
                        {
                            KanjiID = kanji.KanjiID,
                            VocabID = vocabId
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Thêm Kanji thành công", id = kanji.KanjiID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest("Lỗi hệ thống: " + ex.Message);
            }
        }

        // 4. Cập nhật Kanji
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateKanjiDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var kanji = await _context.Kanjis.FindAsync(id);
                if (kanji == null) return NotFound("Không tìm thấy Kanji.");

                // 1. Cập nhật GIF (Chỉ khi client gửi chuỗi base64 mới)
                if (!string.IsNullOrEmpty(dto.StrokeGif) && dto.StrokeGif.StartsWith("data:image"))
                {
                    kanji.StrokeGif = await FileHelper.SaveBase64Image(dto.StrokeGif, "kanji-gifs", dto.Character, _env.WebRootPath);
                }

                // 2. Cập nhật các trường thông tin
                kanji.Character = dto.Character;
                kanji.Onyomi = dto.Onyomi;
                kanji.Kunyomi = dto.Kunyomi;
                kanji.Meaning = dto.Meaning;
                kanji.StrokeCount = dto.StrokeCount;
                kanji.Radical = dto.Radical;
                kanji.Mnemonics = dto.Mnemonics;
                kanji.Popularity = dto.Popularity;
                kanji.Note = dto.Note;
                kanji.Status = dto.Status;
                kanji.LevelID = dto.LevelID;
                kanji.TopicID = dto.TopicID;
                kanji.LessonID = dto.LessonID;
                kanji.UpdatedAt = DateTime.UtcNow;

                // 3. XỬ LÝ LIÊN KẾT TỪ VỰNG
                // Bước A: Xóa toàn bộ liên kết cũ của Kanji này
                var oldLinks = _context.VocabularyKanjis.Where(vk => vk.KanjiID == id);
                _context.VocabularyKanjis.RemoveRange(oldLinks);

                // Bước B: Thêm lại danh sách liên kết mới từ DTO
                if (dto.RelatedVocabIDs != null && dto.RelatedVocabIDs.Any())
                {
                    foreach (var vocabId in dto.RelatedVocabIDs)
                    {
                        _context.VocabularyKanjis.Add(new VocabularyKanjis
                        {
                            KanjiID = id,
                            VocabID = vocabId
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
                return BadRequest("Lỗi: " + ex.Message);
            }
        }

        // 5. Xóa Kanji
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var kanji = await _context.Kanjis.FindAsync(id);
            if (kanji == null) return NotFound("Không tìm thấy Kanji.");

            // Xóa file vật lý
            if (!string.IsNullOrEmpty(kanji.StrokeGif))
            {
                var filePath = Path.Combine(_env.WebRootPath, kanji.StrokeGif.TrimStart('/'));
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            }

            _context.Kanjis.Remove(kanji);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa Kanji" });
        }

        // --- Metadata Methods (Giữ nguyên) ---
        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels()
        {
            var levels = await _context.JLPT_Levels
                .Select(l => new { id = l.LevelID, name = l.LevelName })
                .ToListAsync();
            return Ok(levels);
        }

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics()
        {
            var topics = await _context.Topics
                .Select(t => new { id = t.TopicID, name = t.TopicName })
                .ToListAsync();
            return Ok(topics);
        }

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons()
        {
            var lessons = await _context.Lessons
                .Select(l => new { id = l.LessonID, name = l.Title })
                .ToListAsync();
            return Ok(lessons);
        }
    }
}