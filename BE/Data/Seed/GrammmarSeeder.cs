using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Data.Seed
{
    public static class GrammarSeeder
    {
        private const string GrammarGroupFilePath = "Data/SeedFiles/normalized/grammar_groups.json";
        private const string GrammarFilePath = "Data/SeedFiles/normalized/grammars_n5_n3.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            await SeedGrammarGroupsAsync(context);
            await SeedGrammarsAsync(context);
        }

        private static async Task SeedGrammarGroupsAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<GrammarGroupSeedDto>(GrammarGroupFilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.GroupName))
                    continue;

                var exists = await context.GrammarGroups
                    .AnyAsync(x => x.GroupName == item.GroupName);

                if (exists) continue;

                context.GrammarGroups.Add(new GrammarGroups
                {
                    GrammarGroupID = Guid.NewGuid(),
                    GroupName = item.GroupName,
                    Description = item.Description
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedGrammarsAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<GrammarSeedDto>(GrammarFilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Title))
                    continue;

                var exists = await context.Grammars
                    .AnyAsync(x =>
                        x.Title == item.Title &&
                        x.Structure == item.Structure);

                if (exists) continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                var group = await context.GrammarGroups
                    .FirstOrDefaultAsync(x => x.GroupName == item.Group);

                if (level == null || lesson == null)
                    continue;

                var grammarType = ParseEnumOrDefault(item.GrammarType, GrammarCategory.General);
                var formality = ParseEnumOrDefault(item.Formality, FormalityLevel.Neutral);

                var grammar = new Grammars
                {
                    GrammarID = Guid.NewGuid(),
                    Title = item.Title,
                    Structure = item.Structure ?? "",
                    Meaning = item.Meaning ?? "",
                    Explanation = item.Explanation ?? "",
                    GrammarType = grammarType,
                    Formality = formality,
                    GrammarGroupID = group?.GrammarGroupID,
                    UsageNote = item.UsageNote,
                    Status = item.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LevelID = level.LevelID,
                    LessonID = lesson.LessonID
                };

                context.Grammars.Add(grammar);
                await context.SaveChangesAsync();

                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null) continue;

                    var linked = await context.GrammarTopics
                        .AnyAsync(x =>
                            x.GrammarID == grammar.GrammarID &&
                            x.TopicID == topic.TopicID);

                    if (linked) continue;

                    context.GrammarTopics.Add(new GrammarTopics
                    {
                        GrammarID = grammar.GrammarID,
                        TopicID = topic.TopicID
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        private static TEnum ParseEnumOrDefault<TEnum>(string? value, TEnum defaultValue)
            where TEnum : struct, Enum
        {
            if (Enum.TryParse<TEnum>(value, true, out var result))
                return result;

            return defaultValue;
        }

        private class GrammarGroupSeedDto
        {
            public string GroupName { get; set; }
            public string? Description { get; set; }
        }

        private class GrammarSeedDto
        {
            public string Title { get; set; }
            public string? Structure { get; set; }
            public string? Meaning { get; set; }
            public string? Explanation { get; set; }
            public string? GrammarType { get; set; }
            public string? Formality { get; set; }
            public string? Group { get; set; }
            public string? UsageNote { get; set; }
            public string Level { get; set; }
            public string LessonTitle { get; set; }
            public List<string> Topics { get; set; } = new();
            public int Status { get; set; } = 1;
        }
    }
}