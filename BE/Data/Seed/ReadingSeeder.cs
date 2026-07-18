using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Data.Seed
{
    public static class ReadingSeeder
    {
        private const string FilePath =
            "Data/SeedFiles/generated/readings_generated.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<ReadingSeedDto>(FilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Title) ||
                    string.IsNullOrWhiteSpace(item.Content))
                    continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                if (level == null || lesson == null)
                {
                    Console.WriteLine(
                        $"Skip Reading '{item.Title}': " +
                        $"Level={item.Level}({level != null}), " +
                        $"Lesson={item.LessonTitle}({lesson != null})"
                    );
                    continue;
                }

               var reading = await context.Readings
                    .FirstOrDefaultAsync(x =>
                        x.Title == item.Title &&
                        x.LessonID == lesson.LessonID);
                bool canRegenerateQuestions = true;
                if (reading == null)
                {
                    reading = new Readings
                    {
                        ReadingID = Guid.NewGuid(),
                        Title = item.Title,
                        CreatedAt = DateTime.UtcNow,
                        LevelID = level.LevelID,
                        LessonID = lesson.LessonID
                    };

                    context.Readings.Add(reading);
                }
                else
                {
                    
                   
                    var questionIds = await context.Questions
                        .Where(q => q.ReadingID == reading.ReadingID)
                        .Select(q => q.QuestionID)
                        .ToListAsync();

                    var isUsedInExam = await context.Exam_Questions
                        .AnyAsync(eq =>
                            eq.QuestionID.HasValue &&
                            questionIds.Contains(eq.QuestionID.Value));

                    if (isUsedInExam)
                    {
                        canRegenerateQuestions = false;
                        Console.WriteLine(
                            $"Skip updating questions for Reading '{item.Title}' because it is already used in Exam_Questions."
                        );
                    }
                    else
                    {
                        if (questionIds.Any())
                        {
                            var oldAnswers = await context.Answers
                                .Where(a => questionIds.Contains(a.QuestionID))
                                .ToListAsync();

                            context.Answers.RemoveRange(oldAnswers);

                            var oldQuestions = await context.Questions
                                .Where(q => q.ReadingID == reading.ReadingID)
                                .ToListAsync();

                            context.Questions.RemoveRange(oldQuestions);
                        }
                    }

                    var oldTopics = await context.ReadingTopics
                        .Where(rt => rt.ReadingID == reading.ReadingID)
                        .ToListAsync();

                    context.ReadingTopics.RemoveRange(oldTopics);
                }

                reading.Title = item.Title;
                reading.Content = item.Content;
                reading.Translation = item.Translation ?? "";
                reading.WordCount = item.WordCount > 0
                    ? item.WordCount
                    : item.Content.Length;
                reading.EstimatedTime = item.EstimatedTime > 0
                    ? item.EstimatedTime
                    : 1;
                reading.Status = item.Status;
                reading.LevelID = level.LevelID;
                reading.LessonID = lesson.LessonID;
                reading.UpdatedAt = DateTime.UtcNow;

                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null)
                    {
                        Console.WriteLine(
                            $"Skip topic '{topicName}' for reading '{item.Title}': topic not found"
                        );
                        continue;
                    }

                    context.ReadingTopics.Add(new ReadingTopics
                    {
                        ReadingID = reading.ReadingID,
                        TopicID = topic.TopicID
                    });
                }

                if(canRegenerateQuestions &&
                    item.Questions != null &&
                    item.Questions.Any())
                {
                    foreach (var questionDto in item.Questions)
                    {
                        if (string.IsNullOrWhiteSpace(questionDto.Content))
                            continue;

                        var question = new Questions
                        {
                            QuestionID = Guid.NewGuid(),
                            ReadingID = reading.ReadingID,
                            LessonID = lesson.LessonID,
                            Content = questionDto.Content,
                            Explanation = questionDto.Explanation,
                            Difficulty = questionDto.Difficulty > 0
                                ? questionDto.Difficulty
                                : 1,

                            QuestionType = ParseEnumOrDefault(
                                questionDto.QuestionType,
                                QuestionType.MultipleChoice),

                            QuestionFormat = ParseEnumOrDefault(
                                questionDto.QuestionFormat,
                                QuestionFormat.Passage),

                            SkillType = ParseEnumOrDefault(
                                questionDto.SkillType,
                                SkillType.Reading),

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
                                $"Skip question '{questionDto.Content}' for reading '{item.Title}': invalid answers"
                            );
                            continue;
                        }

                        context.Questions.Add(question);
                    }
                }

                await context.SaveChangesAsync();

                Console.WriteLine(
                    $"Seeded Reading: {item.Title} - {item.Level} - {item.LessonTitle}"
                );
            }
        }

        private static TEnum ParseEnumOrDefault<TEnum>(
            string? value,
            TEnum defaultValue)
            where TEnum : struct
        {
            if (string.IsNullOrWhiteSpace(value))
                return defaultValue;

            return Enum.TryParse<TEnum>(
                value,
                true,
                out var result)
                ? result
                : defaultValue;
        }

        private class ReadingSeedDto
        {
            public string Title { get; set; } = "";
            public string Content { get; set; } = "";
            public string? Translation { get; set; }
            public int WordCount { get; set; }
            public int EstimatedTime { get; set; }
            public int Status { get; set; } = 1;

            public string Level { get; set; } = "";
            public string? CourseTitle { get; set; }
            public string LessonTitle { get; set; } = "";
            public List<string> Topics { get; set; } = new();
            public List<ReadingQuestionSeedDto> Questions { get; set; } = new();
        }

        private class ReadingQuestionSeedDto
        {
            public string Content { get; set; } = "";
            public string? Explanation { get; set; }

            public int DisplayOrder { get; set; }
            public int Difficulty { get; set; } = 1;

            public string QuestionType { get; set; } = "MultipleChoice";
            public string QuestionFormat { get; set; } = "Passage";
            public string SkillType { get; set; } = "Reading";

            public List<ReadingAnswerSeedDto> Answers { get; set; } = new();
        }

        private class ReadingAnswerSeedDto
        {
            public string AnswerText { get; set; } = "";
            public bool IsCorrect { get; set; }
        }
    }
}