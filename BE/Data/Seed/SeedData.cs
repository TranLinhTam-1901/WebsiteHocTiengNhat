using Microsoft.AspNetCore.Identity;
using QuizzTiengNhat.Models;
namespace QuizzTiengNhat.Data.Seed
{
public static class SeedData
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        await CoreSeeder.SeedAsync(context);
        await ExamTemplateSeeder.SeedAsync(context);

        // await WordTypeSeeder.SeedAsync(context);
        // await VocabularySeeder.SeedAsync(context);
        // await KanjiSeeder.SeedAsync(context);
        // await ExampleSeeder.SeedAsync(context);
        // await GrammarSeeder.SeedAsync(context);

        // await VocabularyQuestionSeeder.SeedAsync(context);
        // await KanjiQuestionSeeder.SeedAsync(context);

        // await ReadingSeeder.SeedAsync(context);
        await ListeningSeeder.SeedAsync(context);
    }
}
}