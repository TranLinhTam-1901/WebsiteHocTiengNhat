using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/courses")]
    [Authorize(Roles = "Learner")]
    public class LearnerCourseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Template caps
        private const int TEMPLATE_KANJI = 4;
        private const int TEMPLATE_VOCAB = 10;
        private const int TEMPLATE_READING = 1;
        private const int TEMPLATE_GRAMMAR = 2;   // 1-2
        private const int TEMPLATE_LISTENING = 1;

        private const string PROGRESS_COMPLETED = "Completed";

        public LearnerCourseController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string RequireUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("Missing userId in token.");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            try
            {
                var userId = RequireUserId();
                var user = await _context.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user?.LevelID == null) return BadRequest(new { message = "User level not found." });

                var levelId = user.LevelID.Value;

                var courses = await _context.Courses.AsNoTracking()
                    .Where(c => c.LevelID == levelId)
                    .Select(c => new
                    {
                        c.CourseID,
                        c.CourseName,
                        c.Description,
                        LevelName = c.Level.LevelName
                    })
                    .ToListAsync();

                var courseIds = courses.Select(c => c.CourseID).ToList();
                if (!courseIds.Any())
                {
                    return Ok(new List<CourseListItemDTO>());
                }

                var lessons = await _context.Lessons.AsNoTracking()
                    .Where(l => courseIds.Contains(l.CourseID))
                    .Select(l => new
                    {
                        l.LessonID,
                        l.CourseID,
                        l.Title,
                        l.Priority
                    })
                    .ToListAsync();

                var lessonIds = lessons.Select(l => l.LessonID).ToList();
                var completedLessonIds = await _context.Progresses.AsNoTracking()
                    .Where(p => p.UserID == userId && lessonIds.Contains(p.LessonsID) && p.Status == PROGRESS_COMPLETED)
                    .Select(p => p.LessonsID)
                    .ToListAsync();
                var completedSet = completedLessonIds.ToHashSet();

                var result = courses.Select(c =>
                {
                    var courseLessons = lessons.Where(l => l.CourseID == c.CourseID).ToList();
                    var totalLessons = courseLessons.Count;
                    var completedLessons = courseLessons.Count(l => completedSet.Contains(l.LessonID));
                    var progressPercent = totalLessons == 0 ? 0 : (double)completedLessons / totalLessons * 100d;

                    var continueLesson = courseLessons
                        .OrderBy(l => l.Priority)
                        .FirstOrDefault(l => !completedSet.Contains(l.LessonID));

                    return new CourseListItemDTO
                    {
                        CourseID = c.CourseID,
                        CourseName = c.CourseName,
                        Description = c.Description,
                        LevelName = c.LevelName,
                        TotalLessons = totalLessons,
                        CompletedLessons = completedLessons,
                        ProgressPercent = Math.Round(progressPercent, 2),
                        ContinueLessonID = continueLesson?.LessonID,
                        ContinueLessonTitle = continueLesson?.Title
                    };
                }).ToList();

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [HttpGet("{courseId}/lessons")]
        public async Task<IActionResult> GetLessonsInCourse([FromRoute] Guid courseId)
        {
            try
            {
                var userId = RequireUserId();

                var user = await _context.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);
                if (user?.LevelID == null) return BadRequest(new { message = "User level not found." });

                // Only return lessons from courses of the same level (keeps UI consistent)
                var lessons = await _context.Lessons.AsNoTracking()
                    .Where(l => l.CourseID == courseId && l.Course.LevelID == user.LevelID.Value)
                    .OrderBy(l => l.Priority)
                    .Select(l => new { l.LessonID, l.Title, l.Difficulty, l.Priority })
                    .ToListAsync();

                if (!lessons.Any())
                {
                    return Ok(new List<LessonListItemDTO>());
                }

                var lessonIds = lessons.Select(l => l.LessonID).ToList();

                var publishedStatus = (int)QuizzTiengNhat.Models.Enums.Status.Published;

            

                var kanjiCounts = await _context.Kanjis.AsNoTracking()
                    .Where(k => lessonIds.Contains(k.LessonID) && k.Status == publishedStatus)
                    .GroupBy(k => k.LessonID)
                    .Select(g => new { LessonID = g.Key, Count = g.Count() })
                    .ToListAsync();
                var kanjiCountLookup = kanjiCounts.ToDictionary(x => x.LessonID, x => x.Count);

                var vocabCounts = await _context.Vocabularies.AsNoTracking()
                    .Where(v => lessonIds.Contains(v.LessonID) && v.Status == publishedStatus)
                    .GroupBy(v => v.LessonID)
                    .Select(g => new { LessonID = g.Key, Count = g.Select(x => x.VocabID).Distinct().Count() })
                    .ToListAsync();
                var vocabCountLookup = vocabCounts.ToDictionary(x => x.LessonID, x => x.Count);

                var readingCounts = await _context.Readings.AsNoTracking()
                    .Where(r => lessonIds.Contains(r.LessonID) && r.Status == publishedStatus)
                    .GroupBy(r => r.LessonID)
                    .Select(g => new { LessonID = g.Key, Count = g.Select(x => x.ReadingID).Distinct().Count() })
                    .ToListAsync();
                var readingCountLookup = readingCounts.ToDictionary(x => x.LessonID, x => x.Count);

                var grammarCounts = await _context.Grammars.AsNoTracking()
                    .Where(g => lessonIds.Contains(g.LessonID) && g.Status == publishedStatus)
                    .GroupBy(g => g.LessonID)
                    .Select(g => new { LessonID = g.Key, Count = g.Select(x => x.GrammarID).Distinct().Count() })
                    .ToListAsync();
                var grammarCountLookup = grammarCounts.ToDictionary(x => x.LessonID, x => x.Count);

                var listeningCounts = await _context.Listenings.AsNoTracking()
                    .Where(l => lessonIds.Contains(l.LessonID) && l.Status == publishedStatus)
                    .GroupBy(l => l.LessonID)
                    .Select(g => new { LessonID = g.Key, Count = g.Select(x => x.ListeningID).Distinct().Count() })
                    .ToListAsync();
                var listeningCountLookup = listeningCounts.ToDictionary(x => x.LessonID, x => x.Count);

                // Derive primary topic name from Kanji.TopicID if exists
                var kanjiTopicRows = await _context.Kanjis.AsNoTracking()
                    .Where(k => lessonIds.Contains(k.LessonID) && k.Status == publishedStatus)
                    .Select(k => new { k.LessonID, k.TopicID, k.Popularity })
                    .ToListAsync();

                var primaryTopicByLesson = kanjiTopicRows
                    .GroupBy(x => x.LessonID)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.Popularity).First().TopicID);

                var primaryTopicIds = primaryTopicByLesson.Values.Distinct().ToList();
                var topicNameLookup = primaryTopicIds.Any()
                    ? await _context.Topics.AsNoTracking()
                        .Where(t => primaryTopicIds.Contains(t.TopicID))
                        .ToDictionaryAsync(t => t.TopicID, t => t.TopicName)
                    : new Dictionary<Guid, string>();

                var completedLessonIds = await _context.Progresses.AsNoTracking()
                    .Where(p => p.UserID == userId && lessonIds.Contains(p.LessonsID) && p.Status == PROGRESS_COMPLETED)
                    .Select(p => p.LessonsID)
                    .ToListAsync();
                var completedSet = completedLessonIds.ToHashSet();

                // Recompute with correct logic:
                bool previousIncomplete = false;
                var orderedLessons = lessons.OrderBy(l => l.Priority).ToList();
                var result = orderedLessons.Select(l =>
                {
                    var isCompleted = completedSet.Contains(l.LessonID);
                    var isLocked = previousIncomplete;
                    if (!isCompleted) previousIncomplete = true;

                    Guid? topicId = null;
                    if (primaryTopicByLesson.TryGetValue(l.LessonID, out var tid))
                    {
                        topicId = tid;
                    }

                    int kanji = 0, vocab = 0, reading = 0, grammar = 0, listening = 0;
                    kanji = Math.Min(TEMPLATE_KANJI, kanjiCountLookup.TryGetValue(l.LessonID, out var kk) ? kk : 0);
                    vocab = Math.Min(TEMPLATE_VOCAB, vocabCountLookup.TryGetValue(l.LessonID, out var vv) ? vv : 0);
                    reading = Math.Min(TEMPLATE_READING, readingCountLookup.TryGetValue(l.LessonID, out var rr) ? rr : 0);
                    grammar = Math.Min(TEMPLATE_GRAMMAR, grammarCountLookup.TryGetValue(l.LessonID, out var gg) ? gg : 0);
                    listening = Math.Min(TEMPLATE_LISTENING, listeningCountLookup.TryGetValue(l.LessonID, out var ll) ? ll : 0);

                    return new LessonListItemDTO
                    {
                        LessonID = l.LessonID,
                        Title = l.Title,
                        Difficulty = l.Difficulty,
                        Priority = l.Priority,
                        TopicID = topicId,
                        TopicName = topicId.HasValue && topicNameLookup.TryGetValue(topicId.Value, out var tn) ? tn : null,
                        IsCompleted = isCompleted,
                        IsLocked = isLocked,
                        Counts = new LearnCountsDTO
                        {
                            Kanji = kanji,
                            Vocabulary = vocab,
                            Reading = reading,
                            Grammar = grammar,
                            Listening = listening
                        }
                    };
                }).ToList();

                
                if (result.Any())
                {
                    result[0].IsLocked = false;
                }

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [HttpGet("{lessonId}/learn")]
        public async Task<IActionResult> GetLessonLearn([FromRoute] Guid lessonId)
        {
            try
            {
                var userId = RequireUserId();
                var lesson = await _context.Lessons.AsNoTracking()
                    .Where(l => l.LessonID == lessonId)
                    .Select(l => new { l.LessonID, l.Title })
                    .FirstOrDefaultAsync();
                if (lesson == null) return NotFound();

                var publishedStatus = (int)QuizzTiengNhat.Models.Enums.Status.Published;

                var topicIdSet = new HashSet<Guid>();

                var kanjiTopicIds = await _context.Kanjis.AsNoTracking()
                    .Where(k => k.LessonID == lessonId && k.Status == publishedStatus)
                    .Select(k => k.TopicID)
                    .Distinct()
                    .ToListAsync();
                foreach (var id in kanjiTopicIds) topicIdSet.Add(id);

                var vocabTopicIds = await _context.VocabTopics.AsNoTracking()
                    .Where(vt => vt.Vocabulary.LessonID == lessonId && vt.Vocabulary.Status == publishedStatus)
                    .Select(vt => vt.TopicID)
                    .Distinct()
                    .ToListAsync();
                foreach (var id in vocabTopicIds) topicIdSet.Add(id);

                var grammarTopicIds = await _context.GrammarTopics.AsNoTracking()
                    .Where(gt => gt.Grammar.LessonID == lessonId && gt.Grammar.Status == publishedStatus)
                    .Select(gt => gt.TopicID)
                    .Distinct()
                    .ToListAsync();
                foreach (var id in grammarTopicIds) topicIdSet.Add(id);

                var readingTopicIds = await _context.ReadingTopics.AsNoTracking()
                    .Where(rt => rt.Reading.LessonID == lessonId && rt.Reading.Status == publishedStatus)
                    .Select(rt => rt.TopicID)
                    .Distinct()
                    .ToListAsync();
                foreach (var id in readingTopicIds) topicIdSet.Add(id);

                var listeningTopicIds = await _context.ListeningTopics.AsNoTracking()
                    .Where(lt => lt.Listening.LessonID == lessonId && lt.Listening.Status == publishedStatus)
                    .Select(lt => lt.TopicID)
                    .Distinct()
                    .ToListAsync();
                foreach (var id in listeningTopicIds) topicIdSet.Add(id);

                var topicIds = topicIdSet.ToList();
                var topicNameDict = topicIds.Any()
                    ? await _context.Topics.AsNoTracking()
                        .Where(t => topicIds.Contains(t.TopicID))
                        .Select(t => new { t.TopicID, t.TopicName })
                        .ToDictionaryAsync(x => x.TopicID, x => x.TopicName)
                    : new Dictionary<Guid, string>();

                var topicNames = topicIds.Where(id => topicNameDict.ContainsKey(id)).Select(id => topicNameDict[id]).ToList();

                // --- Kanji ---
                var kanjiItemsRaw = await _context.Kanjis.AsNoTracking()
                    .Where(k => k.LessonID == lessonId
                                && k.Status == publishedStatus)
                    .OrderByDescending(k => k.Popularity)
                    .ThenByDescending(k => k.CreatedAt)
                    .Take(TEMPLATE_KANJI)
                    .Select(k => new KanjiItemDTO
                    {
                        KanjiID = k.KanjiID,
                        Character = k.Character,
                        Onyomi = k.Onyomi,
                        Kunyomi = k.Kunyomi,
                        Meaning = k.Meaning,
                        StrokeCount = k.StrokeCount,
                        Radical = k.Radical == null ? null : new RadicalDTO
                        {
                            RadicalID = k.Radical.RadicalID,
                            Character = k.Radical.Character,
                            Name = k.Radical.Name,
                            Meaning = k.Radical.Meaning,
                            StrokeCount = k.Radical.StrokeCount
                        }
                    })
                    .ToListAsync();

                KanjiBlockDTO? kanjiBlock = null;
                if (kanjiItemsRaw.Any())
                {
                    kanjiBlock = new KanjiBlockDTO
                    {
                        DisplayCount = kanjiItemsRaw.Count,
                        Items = kanjiItemsRaw
                    };
                }

                // --- Vocabulary ---
                var vocabItemsRaw = await _context.Vocabularies.AsNoTracking()
                    .Where(v => v.LessonID == lessonId
                                && v.Status == publishedStatus)
                    .OrderByDescending(v => v.Priority)
                    .Take(TEMPLATE_VOCAB)
                    .Select(v => new VocabularyItemDTO
                    {
                        VocabID = v.VocabID,
                        Word = v.Word,
                        Reading = v.Reading,
                        Meaning = v.Meaning,
                        AudioURL = v.AudioURL,
                        ImageURL = v.ImageURL,
                        Mnemonics = v.Mnemonics,
                        WordTypes = v.VocabWordTypes
                            .Select(vw => vw.WordType.Name)
                            .Distinct()
                            .ToList(),
                        Examples = v.Examples
                            .OrderByDescending(ex => ex.CreatedAt)
                            .Take(2)
                            .Select(ex => new ExampleDTO
                            {
                                Content = ex.Content,
                                Translation = ex.Translation,
                                AudioURL = ex.AudioURL
                            })
                            .ToList()
                    })
                    .ToListAsync();

                VocabularyBlockDTO? vocabBlock = null;
                if (vocabItemsRaw.Any())
                {
                    vocabBlock = new VocabularyBlockDTO
                    {
                        DisplayCount = vocabItemsRaw.Count,
                        Items = vocabItemsRaw
                    };
                }

                // --- Grammar ---
                var grammarItemsRaw = await _context.Grammars.AsNoTracking()
                    .Where(g => g.LessonID == lessonId
                                && g.Status == publishedStatus)
                    .OrderByDescending(g => g.CreatedAt)
                    .Take(TEMPLATE_GRAMMAR)
                    .Select(g => new GrammarItemDTO
                    {
                        GrammarID = g.GrammarID,
                        Title = g.Title,
                        Structure = g.Structure,
                        Meaning = g.Meaning,
                        Explanation = g.Explanation,
                        UsageNote = g.UsageNote,
                        GrammarType = (int)g.GrammarType,
                        Formality = (int)g.Formality,
                        GrammarGroupName = g.GrammarGroupID.HasValue && g.GrammarGroup != null
                            ? g.GrammarGroup.GroupName
                            : null,
                        Examples = g.Examples
                            .OrderByDescending(ex => ex.CreatedAt)
                            .Take(2)
                            .Select(ex => new ExampleDTO
                            {
                                Content = ex.Content,
                                Translation = ex.Translation,
                                AudioURL = ex.AudioURL
                            })
                            .ToList()
                    })
                    .ToListAsync();

                GrammarBlockDTO? grammarBlock = null;
                if (grammarItemsRaw.Any())
                {
                    grammarBlock = new GrammarBlockDTO
                    {
                        DisplayCount = grammarItemsRaw.Count,
                        Items = grammarItemsRaw
                    };
                }

                // --- Reading ---
                var readingItemsRaw = await _context.Readings.AsNoTracking()
                    .Where(r => r.LessonID == lessonId
                                && r.Status == publishedStatus)
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(TEMPLATE_READING)
                    .Select(r => new ReadingItemDTO
                    {
                        ReadingID = r.ReadingID,
                        Title = r.Title,
                        Content = r.Content,
                        Translation = r.Translation,
                        WordCount = r.WordCount,
                        EstimatedTime = r.EstimatedTime
                    })
                    .ToListAsync();

                ReadingBlockDTO? readingBlock = null;
                if (readingItemsRaw.Any())
                {
                    readingBlock = new ReadingBlockDTO
                    {
                        DisplayCount = readingItemsRaw.Count,
                        Items = readingItemsRaw
                    };
                }

                // --- Listening ---
                var listeningItemsRaw = await _context.Listenings.AsNoTracking()
                    .Where(l => l.LessonID == lessonId
                                && l.Status == publishedStatus)
                    .OrderByDescending(l => l.CreatedAt)
                    .Take(TEMPLATE_LISTENING)
                    .Select(l => new ListeningItemDTO
                    {
                        ListeningID = l.ListeningID,
                        Title = l.Title,
                        AudioURL = l.AudioURL,
                        Script = l.Script,
                        Transcript = l.Transcript,
                        Duration = l.Duration,
                        SpeedCategory = l.SpeedCategory
                    })
                    .ToListAsync();

                ListeningBlockDTO? listeningBlock = null;
                if (listeningItemsRaw.Any())
                {
                    listeningBlock = new ListeningBlockDTO
                    {
                        DisplayCount = listeningItemsRaw.Count,
                        Items = listeningItemsRaw
                    };
                }

                var response = new LessonLearnDTO
                {
                    LessonID = lesson.LessonID,
                    LessonTitle = lesson.Title,
                    TopicIDs = topicIds,
                    TopicNames = topicNames,
                    KanjiBlock = kanjiBlock,
                    VocabularyBlock = vocabBlock,
                    GrammarBlock = grammarBlock,
                    ReadingBlock = readingBlock,
                    ListeningBlock = listeningBlock
                };

                return Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }
    }
}

