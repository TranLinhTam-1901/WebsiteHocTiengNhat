using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Data.Seed
{
    public static class CoreSeeder
    {
        private const string BasePath = "Data/SeedFiles/normalized";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            await SeedLevelsAsync(context);
            await SeedTopicsAsync(context);
            await SeedWordTypesAsync(context);
            await SeedCoursesAsync(context);
            await SeedLessonsAsync(context);
        }

        private static async Task SeedLevelsAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<LevelSeedDto>($"{BasePath}/levels.json");

            foreach (var item in items)
            {
                var exists = await context.JLPT_Levels
                    .AnyAsync(x => x.LevelName == item.LevelName);

                if (exists) continue;

                context.JLPT_Levels.Add(new JLPT_Level
                {
                    LevelID = Guid.NewGuid(),
                    LevelName = item.LevelName
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedTopicsAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<TopicSeedDto>($"{BasePath}/topics.json");

            foreach (var item in items)
            {
                var exists = await context.Topics
                    .AnyAsync(x => x.TopicName == item.TopicName);

                if (exists) continue;

                context.Topics.Add(new Topics
                {
                    TopicID = Guid.NewGuid(),
                    TopicName = item.TopicName,
                    Description = item.Description
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedWordTypesAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<WordTypeSeedDto>($"{BasePath}/word_types.json");

            foreach (var item in items)
            {
                var exists = await context.WordTypes
                    .AnyAsync(x => x.Name == item.Name);

                if (exists) continue;

                context.WordTypes.Add(new WordTypes
                {
                    WordTypeID = Guid.NewGuid(),
                    Name = item.Name,
                    Description = item.Description
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedCoursesAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<CourseSeedDto>($"{BasePath}/courses.json");

            foreach (var item in items)
            {
                var exists = await context.Courses
                    .AnyAsync(x => x.CourseName == item.CourseName);

                if (exists) continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                if (level == null) continue;

                context.Courses.Add(new Courses
                {
                    CourseID = Guid.NewGuid(),
                    CourseName = item.CourseName,
                    Description = item.Description,
                    LevelID = level.LevelID
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedLessonsAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<LessonSeedDto>($"{BasePath}/lessons.json");

            foreach (var item in items)
            {
                var exists = await context.Lessons
                    .AnyAsync(x => x.Title == item.Title);

                if (exists) continue;

                var course = await context.Courses
                    .FirstOrDefaultAsync(x => x.CourseName == item.CourseName);

                if (course == null) continue;

                var lesson = new Lessons
                {
                    LessonID = Guid.NewGuid(),
                    CourseID = course.CourseID,
                    Title = item.Title,
                    SortOrder = item.SortOrder
                };

                context.Lessons.Add(lesson);
                await context.SaveChangesAsync();

                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null) continue;

                    var linked = await context.Lessons_Topics
                        .AnyAsync(x => x.LessonsID == lesson.LessonID && x.TopicID == topic.TopicID);

                    if (linked) continue;

                    context.Lessons_Topics.Add(new Lessons_Topic
                    {
                        LessonsID = lesson.LessonID,
                        TopicID = topic.TopicID
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        private class LevelSeedDto
        {
            public string LevelName { get; set; }
        }

        private class TopicSeedDto
        {
            public string TopicName { get; set; }
            public string Description { get; set; }
        }

        private class WordTypeSeedDto
        {
            public string Name { get; set; }
            public string? Description { get; set; }
        }

        private class CourseSeedDto
        {
            public string CourseName { get; set; }
            public string Description { get; set; }
            public string Level { get; set; }
        }

        private class LessonSeedDto
        {
            public string Title { get; set; }
            public string CourseName { get; set; }
            public int SortOrder { get; set; }
            public List<string> Topics { get; set; } = new();
        }
    }
}