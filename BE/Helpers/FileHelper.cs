using System.Text.RegularExpressions;

namespace QuizzTiengNhat.Helpers
{
    public static class FileHelper
    {
        public static string? NormalizeStoredMediaPath(string? value)
        {
            if (string.IsNullOrEmpty(value) || value.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                return value;

            if (value.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
                return value;

            if (Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && uri.AbsolutePath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            {
                return uri.AbsolutePath;
            }

            return value;
        }

        private static string GetExtensionFromDataUrl(string base64String)
        {
            var match = Regex.Match(base64String, @"^data:([^;]+);", RegexOptions.IgnoreCase);
            if (!match.Success) return ".bin";

            return match.Groups[1].Value.ToLowerInvariant() switch
            {
                "image/jpeg" or "image/jpg" => ".jpg",
                "image/png" => ".png",
                "image/gif" => ".gif",
                "image/webp" => ".webp",
                "audio/mpeg" or "audio/mp3" => ".mp3",
                "audio/wav" or "audio/x-wav" or "audio/wave" => ".wav",
                "audio/ogg" => ".ogg",
                "audio/webm" => ".webm",
                "audio/mp4" or "audio/x-m4a" => ".m4a",
                _ => ".bin"
            };
        }

        // Thêm tham số webRootPath vào hàm
        public static async Task<string?> SaveBase64Image(string base64String, string subFolder, string fileNamePrefix, string webRootPath)
        {
            if (string.IsNullOrEmpty(base64String) || !base64String.Contains(',')) return null;

            // Nếu webRootPath null (do chưa tạo folder wwwroot), ta phải tự tạo đường dẫn
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var base64Data = base64String.Split(',')[1];
            var bytes = Convert.FromBase64String(base64Data);
            var extension = GetExtensionFromDataUrl(base64String);

            // Trỏ trực tiếp vào thư mục gốc của dự án
            var folderPath = Path.Combine(webRootPath, "uploads", subFolder);

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var fileName = $"{fileNamePrefix}_{Guid.NewGuid().ToString()[..5]}{extension}";
            var filePath = Path.Combine(folderPath, fileName);

            await File.WriteAllBytesAsync(filePath, bytes);

            // Trả về đường dẫn tương đối để lưu vào DB
            return $"/uploads/{subFolder}/{fileName}";
        }
    }
}