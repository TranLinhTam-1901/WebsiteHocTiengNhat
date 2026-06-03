using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Data.Seed
{
    public static class VocabularyQuestionSeeder
    {
        private const string FilePath =
            "Data/SeedFiles/generated/vocabulary_questions_generated.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items = await JsonSeedReader.ReadListAsync<VocabularyQuestionSeedDto>(FilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Level) ||
                    string.IsNullOrWhiteSpace(item.LessonTitle) ||
                    item.Questions == null ||
                    !item.Questions.Any())
                {
                    continue;
                }

                var lesson = await context.Lessons
                    .FirstOrDefaultAsync(x => x.Title == item.LessonTitle);

                if (lesson == null)
                {
                    Console.WriteLine(
                        $"Skip Vocabulary Question '{item.Word}': Lesson={item.LessonTitle} not found"
                    );
                    continue;
                }

                foreach (var questionDto in item.Questions)
                {
                    if (string.IsNullOrWhiteSpace(questionDto.Content))
                        continue;

                    var exists = await context.Questions
                        .AnyAsync(x =>
                            x.Content == questionDto.Content &&
                            x.LessonID == lesson.LessonID &&
                            x.SkillType == SkillType.Vocabulary &&
                            x.QuestionFormat == QuestionFormat.StandardChoice);

                    if (exists) continue;

                    var question = new Questions
                    {
                        QuestionID = Guid.NewGuid(),
                        LessonID = lesson.LessonID,
                        Content = questionDto.Content,
                        Explanation = questionDto.Explanation,
                        Difficulty = questionDto.Difficulty > 0
                            ? questionDto.Difficulty
                            : 1,
                        QuestionType = QuestionType.MultipleChoice,
                        QuestionFormat = QuestionFormat.StandardChoice,
                        SkillType = SkillType.Vocabulary,
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
                            $"Skip Vocabulary question '{questionDto.Content}': invalid answers"
                        );
                        continue;
                    }

                    context.Questions.Add(question);
                }

                await context.SaveChangesAsync();

                Console.WriteLine(
                    $"Seeded Vocabulary Question: {item.Word} - {item.Level} - {item.LessonTitle}"
                );
            }
        }

        private class VocabularyQuestionSeedDto
        {
            public string Level { get; set; } = "";
            public string? CourseTitle { get; set; }
            public string LessonTitle { get; set; } = "";

            public string Word { get; set; } = "";
            public string Reading { get; set; } = "";
            public string Meaning { get; set; } = "";

            public int Difficulty { get; set; } = 1;
            public int Status { get; set; } = 1;

            public List<VocabularyQuestionItemSeedDto> Questions { get; set; } = new();
        }

        private class VocabularyQuestionItemSeedDto
        {
            public string Content { get; set; } = "";
            public string? Explanation { get; set; }
            public int DisplayOrder { get; set; }
            public int Difficulty { get; set; } = 1;

            public List<VocabularyAnswerSeedDto> Answers { get; set; } = new();
        }

        private class VocabularyAnswerSeedDto
        {
            public string AnswerText { get; set; } = "";
            public bool IsCorrect { get; set; }
        }
    }
}