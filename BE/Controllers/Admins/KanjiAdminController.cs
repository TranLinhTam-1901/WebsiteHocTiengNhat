using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Helpers;
using QuizzTiengNhat.Models.Enums;
using QuizzTiengNhat.DTOs.Admin.Kanji; // Thêm để dùng Enum Status

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
                .Include(k => k.Topic)
                .Include(k => k.Radical)
                .OrderByDescending(k => k.UpdatedAt)
                .Select(k => new
                {
                    id = k.KanjiID,
                    character = k.Character,
                    meaning = k.Meaning,
                    onyomi = k.Onyomi,
                    kunyomi = k.Kunyomi,
                    strokeCount = k.StrokeCount,
                    // SỬA: Lấy tên bộ thủ từ bảng mới
                    radical = k.Radical != null ? new
                    {
                        id = k.Radical.RadicalID, // Đổi radicalID -> id
                        character = k.Radical.Character,
                        name = k.Radical.Name,
                        stroke = k.Radical.StrokeCount // Đổi strokeCount -> stroke
                    } : null,
                    status = k.Status, // Giờ là Enum
                    popularity = k.Popularity,
                    LevelName = k.JLPTLevel != null ? k.JLPTLevel.LevelName : "N/A",
                    TopicName = k.Topic != null ? k.Topic.TopicName : "N/A",
                    updatedAt = k.UpdatedAt
                })
                .ToListAsync();

            return Ok(kanjis);
        }

        // 2. Lấy chi tiết 1 Kanji
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var k = await _context.Kanjis
                .Include(k => k.Radical)
                    .ThenInclude(r => r.RadicalVariants)
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
                radicalID = k.RadicalID,
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
                string? imagePath = null;
                if (!string.IsNullOrEmpty(dto.StrokeGif))
                {
                    imagePath = await FileHelper.SaveBase64Image(dto.StrokeGif, "kanji-gifs", dto.Character, _env.WebRootPath);
                }

                var kanji = new Kanjis
                {
                    KanjiID = Guid.NewGuid(),
                    Character = dto.Character,
                    Onyomi = dto.Onyomi,
                    Kunyomi = dto.Kunyomi,
                    Meaning = dto.Meaning,
                    StrokeCount = dto.StrokeCount,
                    RadicalID = dto.RadicalID, // SỬA: Dùng RadicalID (Guid) thay vì string
                    StrokeGif = imagePath,
                    Mnemonics = dto.Mnemonics,
                    Popularity = dto.Popularity,
                    Note = dto.Note,
                    Status = dto.Status, // SỬA: Mapping sang Enum Status
                    LevelID = dto.LevelID,
                    TopicID = dto.TopicID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Kanjis.Add(kanji);

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

                var radicalExists = await _context.Radicals
                    .AnyAsync(r => r.RadicalID == dto.RadicalID);

                if (!radicalExists)
                    return BadRequest("Radical không tồn tại.");

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
                var kanji = await _context.Kanjis
                    .Include(k => k.RelatedVocabularies)
                    .FirstOrDefaultAsync(k => k.KanjiID == id);
                if (kanji == null) return NotFound("Không tìm thấy Kanji.");

                if (!string.IsNullOrEmpty(dto.StrokeGif) && dto.StrokeGif.StartsWith("data:image"))
                {
                    kanji.StrokeGif = await FileHelper.SaveBase64Image(dto.StrokeGif, "kanji-gifs", dto.Character, _env.WebRootPath);
                }

                kanji.Character = dto.Character;
                kanji.Onyomi = dto.Onyomi;
                kanji.Kunyomi = dto.Kunyomi;
                kanji.Meaning = dto.Meaning;
                kanji.StrokeCount = dto.StrokeCount;
                kanji.RadicalID = dto.RadicalID; // SỬA
                kanji.Mnemonics = dto.Mnemonics;
                kanji.Popularity = dto.Popularity;
                kanji.Note = dto.Note;
                kanji.Status = dto.Status; // SỬA
                kanji.LevelID = dto.LevelID;
                kanji.TopicID = dto.TopicID;
                kanji.LessonID = dto.LessonID;
                kanji.UpdatedAt = DateTime.UtcNow;

                var oldLinks = _context.VocabularyKanjis.Where(vk => vk.KanjiID == id);
                _context.VocabularyKanjis.RemoveRange(oldLinks);

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

            var links = _context.VocabularyKanjis
                .Where(vk => vk.KanjiID == id);

            _context.VocabularyKanjis.RemoveRange(links);

            if (!string.IsNullOrEmpty(kanji.StrokeGif))
            {
                var filePath = Path.Combine(_env.WebRootPath, kanji.StrokeGif.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
            }

            _context.Kanjis.Remove(kanji);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa Kanji" });
        }

        // --- Metadata Methods ---

        // BỔ SUNG: Lấy danh sách bộ thủ để hiển thị trong Select Option
        [HttpGet("metadata/radicals")]
        public async Task<IActionResult> GetRadicals()
        {
            var radicals = await _context.Radicals
                .Include(r => r.RadicalVariants) // Lấy kèm biến thể
                .OrderBy(r => r.StrokeCount)
                .Select(r => new {
                    id = r.RadicalID,
                    // Hiển thị tên kèm các biến thể nếu có
                    name = r.Name + (r.RadicalVariants.Any()
                        ? " [" + string.Join(", ", r.RadicalVariants.Select(v => v.Character)) + "]"
                        : ""),
                    character = r.Character,
                    stroke = r.StrokeCount
                })
                .ToListAsync();
            return Ok(radicals);
        }

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