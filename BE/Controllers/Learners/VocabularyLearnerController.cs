using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/vocabulary")]
    [Authorize(Roles = "Learner")]
    public class VocabularyLearnerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VocabularyLearnerController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetVocabularies()
        {
            var vocabs = await _context.Vocabularies
                .AsNoTracking()
                .Where(v => v.Status == (int)Status.Published)
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

        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var v = await _context.Vocabularies
                .AsNoTracking()
                .Include(x => x.Examples)
                .Include(x => x.VocabWordTypes).ThenInclude(vw => vw.WordType)
                .Include(x => x.VocabTopics).ThenInclude(vt => vt.Topic)
                .Include(x => x.RelatedKanjis).ThenInclude(rk => rk.Kanji)
                .Include(x => x.JLPTLevel)
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.VocabID == id);

            if (v == null) return NotFound("Không tìm thấy từ vựng.");
            if (v.Status != (int)Status.Published)
                return NotFound("Từ vựng không khả dụng.");

            return Ok(new
            {
                vocabID = v.VocabID,
                word = v.Word,
                reading = v.Reading,
                meaning = v.Meaning,
                wordTypes = v.VocabWordTypes.Select(vw => new { id = vw.WordTypeID, name = vw.WordType.Name }).ToList(),
                topics = v.VocabTopics.Select(vt => new { topicID = vt.TopicID, topicName = vt.Topic.TopicName }).ToList(),
                isCommon = v.IsCommon,
                mnemonics = v.Mnemonics,
                imageURL = v.ImageURL,
                audioURL = v.AudioURL,
                priority = v.Priority,
                status = v.Status,
                levelName = v.JLPTLevel != null ? v.JLPTLevel.LevelName : "N/A",
                lessonName = v.Lesson != null ? v.Lesson.Title : "N/A",
                examples = v.Examples.Select(e => new { e.Content, e.Translation }),
                relatedKanjis = v.RelatedKanjis
                    .Where(rk => rk.Kanji != null && rk.Kanji.Status == (int)Status.Published)
                    .Select(rk => new
                    {
                        KanjiID = rk.KanjiID,
                        character = rk.Kanji!.Character,
                        onyomi = rk.Kanji.Onyomi,
                        kunyomi = rk.Kanji.Kunyomi,
                        meaning = rk.Kanji.Meaning
                    })
            });
        }

        [HttpGet("metadata/word-types")]
        public async Task<IActionResult> GetWordTypes() =>
            Ok(await _context.WordTypes.AsNoTracking().Select(w => new { id = w.WordTypeID, name = w.Name }).ToListAsync());

        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() =>
            Ok(await _context.JLPT_Levels.AsNoTracking().Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() =>
            Ok(await _context.Topics.AsNoTracking().Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());
    }
}
