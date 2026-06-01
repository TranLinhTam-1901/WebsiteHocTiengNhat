using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Data.Seed
{
    public static class VocabularySeeder
    {
        private const string FilePath = "Data/SeedFiles/normalized/vocabularies_n5_n3.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<VocabularySeedDto>(FilePath);

            foreach (var item in items)
            {
                var exists = await context.Vocabularies
                    .AnyAsync(x => x.Word == item.Word && x.Reading == item.Reading);

                if (exists) continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                if (level == null || lesson == null) continue;

                var vocab = new Vocabularies
                {
                    VocabID = Guid.NewGuid(),
                    Word = item.Word,
                    Reading = item.Reading,
                    Meaning = item.Meaning,
                    IsCommon = item.IsCommon,
                    Priority = item.Priority,
                    Status = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LevelID = level.LevelID,
                    LessonID = lesson.LessonID
                };

                context.Vocabularies.Add(vocab);
                await context.SaveChangesAsync();

                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null) continue;

                    var linked = await context.VocabTopics
                        .AnyAsync(x => x.VocabID == vocab.VocabID && x.TopicID == topic.TopicID);

                    if (linked) continue;

                    context.VocabTopics.Add(new VocabTopics
                    {
                        VocabID = vocab.VocabID,
                        TopicID = topic.TopicID
                    });
                }

                foreach (var wordTypeName in item.WordTypes ?? new List<string>())
                {
                    var wordType = await context.WordTypes
                        .FirstOrDefaultAsync(x => x.Name == wordTypeName);

                    if (wordType == null) continue;

                    var linked = await context.VocabWordTypes
                        .AnyAsync(x => x.VocabID == vocab.VocabID && x.WordTypeID == wordType.WordTypeID);

                    if (linked) continue;

                    context.VocabWordTypes.Add(new VocabWordTypes
                    {
                        VocabID = vocab.VocabID,
                        WordTypeID = wordType.WordTypeID
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        private class VocabularySeedDto
        {
            public string Word { get; set; }
            public string Reading { get; set; }
            public string Meaning { get; set; }
            public string Level { get; set; }
            public string LessonTitle { get; set; }
            public List<string> Topics { get; set; } = new();
            public List<string> WordTypes { get; set; } = new();
            public bool IsCommon { get; set; }
            public int Priority { get; set; }
        }
    }
}