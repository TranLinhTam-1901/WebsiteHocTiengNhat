using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Data.Seed
{
    public static class ReadingSeeder
    {
        private const string FilePath =
            "Data/SeedFiles/normalized/readings_n5_n3.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<ReadingSeedDto>(FilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Title) ||
                    string.IsNullOrWhiteSpace(item.Content))
                    continue;

                var exists = await context.Readings
                    .AnyAsync(x => x.Title == item.Title);

                if (exists) continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                if (level == null || lesson == null)
                    continue;

                var reading = new Readings
                {
                    ReadingID = Guid.NewGuid(),
                    Title = item.Title,
                    Content = item.Content,
                    Translation = item.Translation ?? "",
                    WordCount = item.WordCount,
                    EstimatedTime = item.EstimatedTime,
                    Status = item.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LevelID = level.LevelID,
                    LessonID = lesson.LessonID
                };

                context.Readings.Add(reading);
                await context.SaveChangesAsync();

                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null) continue;

                    var linked = await context.ReadingTopics
                        .AnyAsync(x =>
                            x.ReadingID == reading.ReadingID &&
                            x.TopicID == topic.TopicID);

                    if (linked) continue;

                    context.ReadingTopics.Add(new ReadingTopics
                    {
                        ReadingID = reading.ReadingID,
                        TopicID = topic.TopicID
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        private class ReadingSeedDto
        {
            public string Title { get; set; }
            public string Content { get; set; }
            public string? Translation { get; set; }
            public int WordCount { get; set; }
            public int EstimatedTime { get; set; }
            public int Status { get; set; } = 1;
            public string Level { get; set; }
            public string LessonTitle { get; set; }
            public List<string> Topics { get; set; } = new();
        }
    }
}