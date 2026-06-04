using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Data.Seed
{
    public static class ListeningSeeder
    {
        private const string FilePath =
            "Data/SeedFiles/generated/listenings_generated.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<ListeningSeedDto>(FilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Title) ||
                    string.IsNullOrWhiteSpace(item.AudioUrl))
                    continue;

                var level = await context.JLPT_Levels
                    .FirstOrDefaultAsync(x => x.LevelName == item.Level);

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                if (level == null || lesson == null)
                {
                    Console.WriteLine(
                        $"Skip Listening '{item.Title}': " +
                        $"Level={item.Level}({level != null}), " +
                        $"Lesson={item.LessonTitle}({lesson != null})"
                    );
                    continue;
                }

                var listening = await context.Listenings
                .FirstOrDefaultAsync(x =>
                    x.Title == item.Title &&
                    x.LessonID == lesson.LessonID);

                var isNewListening = false;

                if (listening == null)
                {
                    isNewListening = true;

                    listening = new Listenings
                    {
                        ListeningID = Guid.NewGuid(),
                        Title = item.Title,
                        AudioURL = item.AudioUrl,
                        Script = item.Script ?? "",
                        Transcript = item.Transcript ?? "",
                        Duration = item.Duration > 0 ? item.Duration : 45,
                        SpeedCategory = item.SpeedCategory,
                        Status = item.Status,
                        LevelID = level.LevelID,
                        LessonID = lesson.LessonID
                    };

                    context.Listenings.Add(listening);
                }
                else
                {
                    listening.AudioURL = item.AudioUrl;
                    listening.Script = item.Script ?? "";
                    listening.Transcript = item.Transcript ?? "";
                    listening.Duration = item.Duration > 0 ? item.Duration : 45;
                    listening.SpeedCategory = item.SpeedCategory;
                    listening.Status = item.Status;
                    listening.LevelID = level.LevelID;
                    listening.LessonID = lesson.LessonID;
                }

                if (isNewListening)
                {
                foreach (var topicName in item.Topics ?? new List<string>())
                {
                    var topic = await context.Topics
                        .FirstOrDefaultAsync(x => x.TopicName == topicName);

                    if (topic == null)
                    {
                        Console.WriteLine(
                            $"Skip topic '{topicName}' for listening '{item.Title}': topic not found"
                        );
                        continue;
                    }

                    context.ListeningTopics.Add(new ListeningTopics
                    {
                        ListeningID = listening.ListeningID,
                        TopicID = topic.TopicID
                    });
                }
                }

                if (item.Questions != null && item.Questions.Any())
                {
                    foreach (var questionDto in item.Questions)
                    {
                        if (string.IsNullOrWhiteSpace(questionDto.Content))
                            continue;

                        var question = await context.Questions
                            .FirstOrDefaultAsync(q =>
                                q.ListeningID == listening.ListeningID &&
                                q.DisplayOrder == questionDto.DisplayOrder);

                        if (question == null)
                        {
                            var answers = questionDto.Answers
                                .Where(a => !string.IsNullOrWhiteSpace(a.AnswerText))
                                .Select(a => new Answers
                                {
                                    AnswerID = Guid.NewGuid(),
                                    AnswerText = a.AnswerText,
                                    IsCorrect = a.IsCorrect
                                })
                                .ToList();

                            if (answers.Count < 2 || answers.Count(a => a.IsCorrect) != 1)
                            {
                                Console.WriteLine(
                                    $"Skip question '{questionDto.Content}' for listening '{item.Title}': invalid answers"
                                );
                                continue;
                            }

                            question = new Questions
                            {
                                QuestionID = Guid.NewGuid(),
                                ListeningID = listening.ListeningID,
                                LessonID = lesson.LessonID,
                                Content = questionDto.Content,
                                Explanation = questionDto.Explanation,
                                Difficulty = questionDto.Difficulty > 0 ? questionDto.Difficulty : 1,
                                QuestionType = QuestionType.MultipleChoice,
                                QuestionFormat = QuestionFormat.AudioChoice,
                                SkillType = SkillType.Listening,
                                ImageURL = questionDto.ImageUrl,
                                MediaTimestamp = questionDto.MediaTimestamp,
                                Status = Status.Published,
                                DisplayOrder = questionDto.DisplayOrder,
                                Answers = answers
                            };

                            context.Questions.Add(question);
                        }
                        else
                        {
                            question.LessonID = lesson.LessonID;
                            question.Content = questionDto.Content;
                            question.Explanation = questionDto.Explanation;
                            question.Difficulty = questionDto.Difficulty > 0 ? questionDto.Difficulty : 1;
                            question.QuestionType = QuestionType.MultipleChoice;
                            question.QuestionFormat = QuestionFormat.AudioChoice;
                            question.SkillType = SkillType.Listening;
                            question.ImageURL = questionDto.ImageUrl;
                            question.MediaTimestamp = questionDto.MediaTimestamp;
                            question.Status = Status.Published;

                            // Không update Answers để tránh làm hỏng Exam_Result_Details.SelectedAnswerID cũ
                        }
                    }
                }

                await context.SaveChangesAsync();

                Console.WriteLine(
                    $"Seeded Listening: {item.Title} - {item.Level} - {item.LessonTitle}"
                );
            }
        }

        private class ListeningSeedDto
        {
            public string Title { get; set; } = "";
            public string AudioUrl { get; set; } = "";
            public string? Script { get; set; }
            public string? Transcript { get; set; }
            public int Duration { get; set; } = 45;
            public string? SpeedCategory { get; set; }
            public int Status { get; set; } = 1;

            public string Level { get; set; } = "";
            public string? CourseTitle { get; set; }
            public string LessonTitle { get; set; } = "";
            public List<string> Topics { get; set; } = new();
            public List<ListeningQuestionSeedDto> Questions { get; set; } = new();
        }

        private class ListeningQuestionSeedDto
        {
            public string Content { get; set; } = "";
            public string? Explanation { get; set; }
            public string? ImageUrl { get; set; }
            public string? MediaTimestamp { get; set; }
            public int DisplayOrder { get; set; }
            public int Difficulty { get; set; } = 1;
            public string QuestionType { get; set; } = "";
            public List<ListeningAnswerSeedDto> Answers { get; set; } = new();
        }

        private class ListeningAnswerSeedDto
        {
            public string AnswerText { get; set; } = "";
            public bool IsCorrect { get; set; }
        }
    }
}