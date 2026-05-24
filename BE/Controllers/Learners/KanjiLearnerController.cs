using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/kanji")]
    [Authorize(Roles = "Learner")]
    public class KanjiLearnerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public KanjiLearnerController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetKanjis()
        {
            var kanjis = await _context.Kanjis
                .AsNoTracking()
                .Where(k => k.Status == (int)Status.Published)
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
                    radical = k.Radical != null ? new
                    {
                        id = k.Radical.RadicalID,
                        character = k.Radical.Character,
                        name = k.Radical.Name,
                        stroke = k.Radical.StrokeCount
                    } : null,
                    status = k.Status,
                    popularity = k.Popularity,
                    levelName = k.JLPTLevel != null ? k.JLPTLevel.LevelName : "N/A",
                    topicName = k.Topic != null ? k.Topic.TopicName : "N/A",
                    updatedAt = k.UpdatedAt
                })
                .ToListAsync();

            return Ok(kanjis);
        }

        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var k = await _context.Kanjis
                .AsNoTracking()
                .Include(x => x.Radical).ThenInclude(r => r!.RadicalVariants)
                .Include(x => x.RelatedVocabularies).ThenInclude(rv => rv.Vocabulary)
                .Include(x => x.JLPTLevel)
                .Include(x => x.Topic)
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.KanjiID == id);

            if (k == null) return NotFound("Không tìm thấy Kanji.");
            if (k.Status != (int)Status.Published)
                return NotFound("Kanji không khả dụng.");

            return Ok(new
            {
                id = k.KanjiID,
                character = k.Character,
                onyomi = k.Onyomi,
                kunyomi = k.Kunyomi,
                meaning = k.Meaning,
                strokeCount = k.StrokeCount,
                strokeGif = k.StrokeGif,
                mnemonics = k.Mnemonics,
                popularity = k.Popularity,
                note = k.Note,
                radical = k.Radical == null ? null : new
                {
                    id = k.Radical.RadicalID,
                    character = k.Radical.Character,
                    name = k.Radical.Name,
                    stroke = k.Radical.StrokeCount
                },
                radicalVariants = k.Radical == null
                    ? Enumerable.Empty<object>()
                    : k.Radical.RadicalVariants.Select(v => new
                    {
                        variantID = v.VariantID,
                        character = v.Character,
                        name = v.Name,
                        radicalID = v.RadicalID
                    }),
                levelName = k.JLPTLevel != null ? k.JLPTLevel.LevelName : "N/A",
                topicName = k.Topic != null ? k.Topic.TopicName : "N/A",
                lessonName = k.Lesson != null ? k.Lesson.Title : "N/A",
                relatedVocabs = k.RelatedVocabularies
                    .Where(rv => rv.Vocabulary != null && rv.Vocabulary.Status == (int)Status.Published)
                    .Select(rv => new
                    {
                        vocabID = rv.VocabID,
                        word = rv.Vocabulary!.Word,
                        reading = rv.Vocabulary.Reading,
                        meaning = rv.Vocabulary.Meaning
                    })
            });
        }

        [HttpGet("metadata/radicals")]
        public async Task<IActionResult> GetRadicals()
        {
            var radicals = await _context.Radicals
                .AsNoTracking()
                .Include(r => r.RadicalVariants)
                .OrderBy(r => r.StrokeCount)
                .Select(r => new
                {
                    id = r.RadicalID,
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
        public async Task<IActionResult> GetLevels() =>
            Ok(await _context.JLPT_Levels.AsNoTracking().Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() =>
            Ok(await _context.Topics.AsNoTracking().Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());
    }
}
