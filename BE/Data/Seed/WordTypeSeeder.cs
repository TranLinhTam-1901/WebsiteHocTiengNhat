using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
public static class WordTypeSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        var wordTypes = new[]
        {
            "Danh từ",
            "Động từ",
            "Tính từ i",
            "Tính từ na",
            "Phó từ",
            "Trợ từ",
            "Liên từ",
            "Cụm biểu đạt",
            "Thành ngữ"
        };

        foreach (var name in wordTypes)
        {
            var exists = await context.WordTypes
                .AnyAsync(x => x.Name == name);

            if (exists) continue;

            context.WordTypes.Add(new WordTypes
            {
                WordTypeID = Guid.NewGuid(),
                Name = name
            });
        }

        await context.SaveChangesAsync();
    }
}