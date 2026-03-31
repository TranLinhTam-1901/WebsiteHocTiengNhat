using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Admin.Vocabulary;
using QuizzTiengNhat.Helpers;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

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

        // 1. Lấy danh sách từ vựng
        [HttpGet("get-all")]
        public async Task<IActionResult> GetVocabularies()
        {
            var vocabs = await _context.Vocabularies
                .Include(v => v.JLPTLevel)
                .Include(v => v.Lesson)
                .Include(v => v.VocabTopics).ThenInclude(vt => vt.Topic)
                .Include(v => v.VocabWordTypes).ThenInclude(vw => vw.WordType)
                .OrderByDescending(v => v.UpdatedAt)
                .Select(v => new
                {
                    vocabID = v.VocabID,
                    word = v.Word,
                    reading = v.Reading,
                    meaning = v.Meaning,
                    wordTypes = v.VocabWordTypes.Select(vw => vw.WordType.Name).ToList(),
                    topics = v.VocabTopics.Select(vt => vt.Topic.TopicName).ToList(),
                    isCommon = v.IsCommon,
                    priority = v.Priority,
                    status = v.Status,
                    levelName = v.JLPTLevel != null ? v.JLPTLevel.LevelName : "N/A",
                    lessonName = v.Lesson != null ? v.Lesson.Title : "N/A",
                    updatedAt = v.UpdatedAt
                })
                .ToListAsync();

            return Ok(vocabs);
        }

        // 2. Lấy chi tiết
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var v = await _context.Vocabularies
                .Include(v => v.Examples)
                .Include(v => v.VocabWordTypes)
                .Include(v => v.VocabTopics) // SỬA: Lấy danh sách Topic liên kết
                .Include(v => v.RelatedKanjis).ThenInclude(rk => rk.Kanji)
                .FirstOrDefaultAsync(v => v.VocabID == id);

            if (v == null) return NotFound("Không tìm thấy từ vựng.");

            return Ok(new
            {
                word = v.Word,
                reading = v.Reading,
                meaning = v.Meaning,
                wordTypeIDs = v.VocabWordTypes.Select(vw => vw.WordTypeID).ToList(),
                // SỬA: Trả về danh sách TopicIDs thay vì 1 TopicID duy nhất
                topicIDs = v.VocabTopics.Select(vt => vt.TopicID).ToList(),
                isCommon = v.IsCommon,
                mnemonics = v.Mnemonics,
                imageURL = v.ImageURL,
                audioURL = v.AudioURL,
                priority = v.Priority,
                status = v.Status,
                levelID = v.LevelID,
                lessonID = v.LessonID,
                examples = v.Examples.Select(e => new { e.Content, e.Translation }),
                relatedKanjiIDs = v.RelatedKanjis.Select(rk => rk.KanjiID).ToList()
            });
        }

        // 3. Thêm mới
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateVocabDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                string audioPath = !string.IsNullOrEmpty(dto.AudioURL) && dto.AudioURL.Contains("base64,")
                    ? await FileHelper.SaveBase64Image(dto.AudioURL, "vocab-audios", dto.Word, _env.WebRootPath) : dto.AudioURL;
                string imagePath = !string.IsNullOrEmpty(dto.ImageURL) && dto.ImageURL.Contains("base64,")
                    ? await FileHelper.SaveBase64Image(dto.ImageURL, "vocab-images", dto.Word, _env.WebRootPath) : dto.ImageURL;

                var vocab = new Vocabularies
                {
                    VocabID = Guid.NewGuid(),
                    Word = dto.Word,
                    Reading = dto.Reading,
                    Meaning = dto.Meaning,
                    IsCommon = dto.IsCommon,
                    Mnemonics = dto.Mnemonics,
                    AudioURL = audioPath,
                    ImageURL = imagePath,
                    Priority = dto.Priority,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Vocabularies.Add(vocab);

                // SỬA: Thêm nhiều loại từ
                if (dto.WordTypeIDs != null)
                {
                    foreach (var typeId in dto.WordTypeIDs)
                        _context.VocabWordTypes.Add(new VocabWordTypes { VocabID = vocab.VocabID, WordTypeID = typeId });
                }

                // MỚI: Thêm nhiều Topic vào bảng trung gian VocabTopics
                if (dto.TopicIDs != null)
                {
                    foreach (var topicId in dto.TopicIDs)
                        _context.VocabTopics.Add(new VocabTopics { VocabID = vocab.VocabID, TopicID = topicId });
                }

                // Thêm ví dụ & Kanji
                if (dto.Examples != null)
                {
                    foreach (var ex in dto.Examples)
                        _context.Examples.Add(new Examples { ExampleID = Guid.NewGuid(), Content = ex.Content, Translation = ex.Translation, VocabID = vocab.VocabID });
                }

                if (dto.RelatedKanjiIDs != null)
                {
                    foreach (var kanjiId in dto.RelatedKanjiIDs)
                        _context.VocabularyKanjis.Add(new VocabularyKanjis { VocabID = vocab.VocabID, KanjiID = kanjiId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Thêm từ vựng thành công", id = vocab.VocabID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }

        // 4. Cập nhật
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateVocabDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var vocab = await _context.Vocabularies
                    .Include(v => v.Examples)
                    .Include(v => v.RelatedKanjis)
                    .Include(v => v.VocabWordTypes)
                    .Include(v => v.VocabTopics) // SỬA: Thêm Include Topics
                    .FirstOrDefaultAsync(v => v.VocabID == id);

                if (vocab == null) return NotFound();

                // Logic File giữ nguyên
                if (!string.IsNullOrEmpty(dto.AudioURL) && dto.AudioURL.Contains("base64,"))
                    vocab.AudioURL = await FileHelper.SaveBase64Image(dto.AudioURL, "vocab-audios", dto.Word, _env.WebRootPath);
                if (!string.IsNullOrEmpty(dto.ImageURL) && dto.ImageURL.Contains("base64,"))
                    vocab.ImageURL = await FileHelper.SaveBase64Image(dto.ImageURL, "vocab-images", dto.Word, _env.WebRootPath);

                vocab.Word = dto.Word;
                vocab.Reading = dto.Reading;
                vocab.Meaning = dto.Meaning;
                vocab.IsCommon = dto.IsCommon;
                vocab.Mnemonics = dto.Mnemonics;
                vocab.Priority = dto.Priority;
                vocab.Status = dto.Status;
                vocab.LevelID = dto.LevelID;
                vocab.LessonID = dto.LessonID;
                vocab.UpdatedAt = DateTime.UtcNow;

                // SỬA: Cập nhật danh sách loại từ
                _context.VocabWordTypes.RemoveRange(vocab.VocabWordTypes);
                if (dto.WordTypeIDs != null)
                {
                    foreach (var typeId in dto.WordTypeIDs)
                        _context.VocabWordTypes.Add(new VocabWordTypes { VocabID = id, WordTypeID = typeId });
                }

                // MỚI: Cập nhật danh sách Topics (Xóa cũ thêm mới)
                _context.VocabTopics.RemoveRange(vocab.VocabTopics);
                if (dto.TopicIDs != null)
                {
                    foreach (var topicId in dto.TopicIDs)
                        _context.VocabTopics.Add(new VocabTopics { VocabID = id, TopicID = topicId });
                }

                // Cập nhật Examples & Kanji (Xóa cũ thêm mới)
                _context.Examples.RemoveRange(vocab.Examples);
                if (dto.Examples != null)
                {
                    foreach (var ex in dto.Examples)
                        _context.Examples.Add(new Examples { ExampleID = Guid.NewGuid(), Content = ex.Content, Translation = ex.Translation, VocabID = id });
                }

                _context.VocabularyKanjis.RemoveRange(vocab.RelatedKanjis);
                if (dto.RelatedKanjiIDs != null)
                {
                    foreach (var kanjiId in dto.RelatedKanjiIDs)
                        _context.VocabularyKanjis.Add(new VocabularyKanjis { VocabID = id, KanjiID = kanjiId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
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
        [HttpGet("metadata/word-types")]
        public async Task<IActionResult> GetWordTypes() =>Ok(await _context.WordTypes.Select(w => new { id = w.WordTypeID, name = w.Name }).ToListAsync());

        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() => Ok(await _context.JLPT_Levels.Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() => Ok(await _context.Topics.Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons() => Ok(await _context.Lessons.Select(l => new { id = l.LessonID, name = l.Title }).ToListAsync());
    }
}