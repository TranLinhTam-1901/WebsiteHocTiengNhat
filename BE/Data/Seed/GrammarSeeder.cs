using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Data.Seed
{
    public static class GrammarSeeder
    {
        private const string FilePath =
            "Data/SeedFiles/generated/grammars_generated.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<GrammarSeedDto>(FilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Title) &&
                    string.IsNullOrWhiteSpace(item.Pattern))
                    continue;

                if (string.IsNullOrWhiteSpace(item.LessonTitle))
                    continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                if (level == null || lesson == null)
                {
                    Console.WriteLine(
                        $"Skip Grammar '{item.Pattern}': " +
                        $"Level={item.Level}({level != null}), " +
                        $"Lesson={item.LessonTitle}({lesson != null})"
                    );
                    continue;
                }

                var grammarTitle = !string.IsNullOrWhiteSpace(item.Title)
                    ? item.Title
                    : item.Pattern;

                var exists = await context.Grammars
                    .AnyAsync(x =>
                        x.Title == grammarTitle &&
                        x.LessonID == lesson.LessonID);

                if (exists) continue;

                var grammar = new Grammars
                {
                    GrammarID = Guid.NewGuid(),

                    Title = grammarTitle,
                    Structure = item.Structure,
                    Meaning = item.Meaning,

                    Explanation = !string.IsNullOrWhiteSpace(item.Explanation)
                        ? item.Explanation
                        : $"Mẫu {item.Pattern} có nghĩa là \"{item.Meaning}\". Cấu trúc: {item.Structure}. Ví dụ: {item.Example} - {item.Translation}",

                    GrammarType = GrammarCategory.General,
                    Formality = FormalityLevel.Polite,

                    UsageNote = !string.IsNullOrWhiteSpace(item.Example)
                        ? $"Ví dụ: {item.Example} - {item.Translation}"
                        : null,

                    Status = item.Status,
                    LevelID = level.LevelID,
                    LessonID = lesson.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.Grammars.Add(grammar);

                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null)
                    {
                        Console.WriteLine(
                            $"Skip topic '{topicName}' for grammar '{grammarTitle}': topic not found"
                        );
                        continue;
                    }

                    context.GrammarTopics.Add(new GrammarTopics
                    {
                        GrammarID = grammar.GrammarID,
                        TopicID = topic.TopicID
                    });
                }

                if (item.Questions != null && item.Questions.Any())
                {
                    foreach (var questionDto in item.Questions)
                    {
                        if (string.IsNullOrWhiteSpace(questionDto.Content))
                            continue;

                        var questionExists = await context.Questions
                            .AnyAsync(x =>
                                x.Content == questionDto.Content &&
                                x.LessonID == lesson.LessonID &&
                                x.SkillType == SkillType.Grammar &&
                                x.QuestionFormat == QuestionFormat.StandardChoice);

                        if (questionExists) continue;

                        var question = new Questions
                        {
                            QuestionID = Guid.NewGuid(),
                            LessonID = lesson.LessonID,
                            Content = questionDto.Content,

                            Explanation = !string.IsNullOrWhiteSpace(questionDto.Explanation)
                                ? questionDto.Explanation
                                : grammar.Explanation,

                            Difficulty = questionDto.Difficulty > 0
                                ? questionDto.Difficulty
                                : item.Difficulty > 0
                                    ? item.Difficulty
                                    : 1,

                            QuestionType = QuestionType.MultipleChoice,
                            QuestionFormat = QuestionFormat.StandardChoice,
                            SkillType = SkillType.Grammar,
                            Status = Status.Published,
                            DisplayOrder = questionDto.DisplayOrder,

                            Answers = questionDto.Answers
                                .Where(a => !string.IsNullOrWhiteSpace(a.AnswerText))
                                .Select(a => new Answers
                                {
                                    AnswerID = Guid.NewGuid(),
                                    AnswerText = a.AnswerText,
                                    IsCorrect = a.IsCorrect
                                })
                                .ToList()
                        };

                        if (question.Answers.Count < 2 ||
                            question.Answers.Count(a => a.IsCorrect) != 1)
                        {
                            Console.WriteLine(
                                $"Skip question '{questionDto.Content}' for grammar '{grammarTitle}': invalid answers"
                            );
                            continue;
                        }

                        context.Questions.Add(question);
                    }
                }

                await context.SaveChangesAsync();

                Console.WriteLine(
                    $"Seeded Grammar: {grammarTitle} - {item.Level} - {item.LessonTitle}"
                );
            }
        }

        private class GrammarSeedDto
        {
            public string Level { get; set; } = "";
            public string? CourseTitle { get; set; }
            public string LessonTitle { get; set; } = "";

            public string Topic { get; set; } = "";
            public List<string> Topics { get; set; } = new();

            public string Title { get; set; } = "";
            public string Pattern { get; set; } = "";
            public string Meaning { get; set; } = "";
            public string Structure { get; set; } = "";
            public string Example { get; set; } = "";
            public string Translation { get; set; } = "";
            public string Explanation { get; set; } = "";

            public int Difficulty { get; set; } = 1;
            public int Status { get; set; } = 1;

            public List<GrammarQuestionSeedDto> Questions { get; set; } = new();
        }

        private class GrammarQuestionSeedDto
        {
            public string Content { get; set; } = "";
            public string? Explanation { get; set; }
            public int DisplayOrder { get; set; }
            public int Difficulty { get; set; } = 1;
            public List<GrammarAnswerSeedDto> Answers { get; set; } = new();
        }

        private class GrammarAnswerSeedDto
        {
            public string AnswerText { get; set; } = "";
            public bool IsCorrect { get; set; }
        }
    }
}