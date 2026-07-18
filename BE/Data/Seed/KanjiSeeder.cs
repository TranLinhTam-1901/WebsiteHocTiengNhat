using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Data.Seed
{
    public static class KanjiSeeder
    {
        private const string RadicalFilePath = "Data/SeedFiles/normalized/radicals.json";
        private const string KanjiFilePath = "Data/SeedFiles/normalized/kanjis_n5_n3.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            await SeedRadicalsAsync(context);
            await SeedKanjisAsync(context);
            await SeedVocabularyKanjisAsync(context);
        }

        private static async Task SeedRadicalsAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<RadicalSeedDto>(RadicalFilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Character))
                    continue;

                var exists = await context.Radicals
                    .AnyAsync(x => x.Character == item.Character);

                if (exists) continue;

                context.Radicals.Add(new Radicals
                {
                    RadicalID = Guid.NewGuid(),
                    Character = item.Character,
                    Name = string.IsNullOrWhiteSpace(item.Name)
                        ? $"Bộ {item.Character}"
                        : item.Name,
                    Meaning = item.Meaning,
                    StrokeCount = item.StrokeCount,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedKanjisAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<KanjiSeedDto>(KanjiFilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Character))
                    continue;

                var exists = await context.Kanjis
                    .AnyAsync(x => x.Character == item.Character);

                if (exists) continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

               var course = await context.Courses
                .FirstOrDefaultAsync(x =>
                    x.CourseName == item.CourseTitle &&
                    x.LevelID == level.LevelID);

                if (course == null)
                    continue;

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x =>
                        x.Title == item.LessonTitle &&
                        x.CourseID == course.CourseID);

                var topic = await context.Topics
                    .FirstOrDefaultAsync(x => x.TopicName == item.Topic);

                var radical = await context.Radicals
                    .FirstOrDefaultAsync(x => x.Character == item.Radical);

                if (level == null || course == null || lesson == null || topic == null || radical == null)
                    continue;

                context.Kanjis.Add(new Kanjis
                {
                    KanjiID = Guid.NewGuid(),
                    Character = item.Character,
                    Onyomi = item.Onyomi ?? "",
                    Kunyomi = item.Kunyomi ?? "",
                    Meaning = item.Meaning ?? "",
                    StrokeCount = item.StrokeCount,
                    RadicalID = radical.RadicalID,
                    SearchVector = $"{item.Character} {item.Onyomi} {item.Kunyomi} {item.Meaning}",
                    Popularity = item.Popularity,
                    Status = item.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LevelID = level.LevelID,
                    LessonID = lesson.LessonID,
                    TopicID = topic.TopicID
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedVocabularyKanjisAsync(ApplicationDbContext context)
        {
            var vocabularies = await context.Vocabularies
                .Select(v => new
                {
                    v.VocabID,
                    v.Word
                })
                .ToListAsync();

            var kanjis = await context.Kanjis
                .Select(k => new
                {
                    k.KanjiID,
                    k.Character
                })
                .ToListAsync();

            foreach (var vocab in vocabularies)
            {
                foreach (var kanji in kanjis)
                {
                    if (!vocab.Word.Contains(kanji.Character))
                        continue;

                    var exists = await context.VocabularyKanjis
                        .AnyAsync(x =>
                            x.VocabID == vocab.VocabID &&
                            x.KanjiID == kanji.KanjiID);

                    if (exists) continue;

                    context.VocabularyKanjis.Add(new VocabularyKanjis
                    {
                        VocabID = vocab.VocabID,
                        KanjiID = kanji.KanjiID
                    });
                }
            }

            await context.SaveChangesAsync();
        }

        private class RadicalSeedDto
        {
            public string Character { get; set; }
            public string? Name { get; set; }
            public string? Meaning { get; set; }
            public int StrokeCount { get; set; }
            public List<string>? Variants { get; set; }
        }

        private class KanjiSeedDto
        {
            public string Character { get; set; }
            public string? Onyomi { get; set; }
            public string? Kunyomi { get; set; }
            public string? Meaning { get; set; }
            public int StrokeCount { get; set; }
            public string Radical { get; set; }
            public string Level { get; set; }
            public string Topic { get; set; }
            public string CourseTitle { get; set; }
            public string LessonTitle { get; set; }
            public int Popularity { get; set; }
            public int Status { get; set; }
        }
    }
}