using System.Text.Json;

namespace QuizzTiengNhat.Data.Seed
{
    public static class JsonSeedReader
    {
        public static async Task<List<T>> ReadListAsync<T>(string filePath)
        {
            if (!File.Exists(filePath))
                return new List<T>();

            var json = await File.ReadAllTextAsync(filePath);

            return JsonSerializer.Deserialize<List<T>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<T>();
        }
    }
}