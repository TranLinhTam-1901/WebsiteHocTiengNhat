using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Data.Seed
{
    public static class ExampleSeeder
    {
        private const string FilePath =
            "Data/SeedFiles/normalized/examples_n5_n3.json";

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var items =
                await JsonSeedReader.ReadListAsync<ExampleSeedDto>(FilePath);

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Content))
                    continue;

                var vocab = await context.Vocabularies
                    .FirstOrDefaultAsync(x =>
                        x.Word == item.TargetWord &&
                        x.Reading == item.TargetReading);

                if (vocab == null)
                    continue;

                var exists = await context.Examples
                    .AnyAsync(x =>
                        x.Content == item.Content &&
                        x.VocabID == vocab.VocabID);

                if (exists)
                    continue;

                context.Examples.Add(new Examples
                {
                    ExampleID = Guid.NewGuid(),
                    Content = item.Content,
                    Translation = item.Translation,
                    AudioURL = null,
                    VocabID = vocab.VocabID,
                    GrammarID = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await context.SaveChangesAsync();
        }

        private class ExampleSeedDto
        {
            public string Content { get; set; }
            public string Translation { get; set; }

            public string TargetWord { get; set; }
            public string TargetReading { get; set; }

            public string Level { get; set; }
        }
    }
}