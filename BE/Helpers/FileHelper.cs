namespace QuizzTiengNhat.Helpers
{
    public static class FileHelper
    {
        // Thêm tham số webRootPath vào hàm
        public static async Task<string> SaveBase64Image(string base64String, string subFolder, string fileNamePrefix, string webRootPath)
        {
            if (string.IsNullOrEmpty(base64String) || !base64String.Contains(",")) return null;

            // Nếu webRootPath null (do chưa tạo folder wwwroot), ta phải tự tạo đường dẫn
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var base64Data = base64String.Split(',')[1];
            var bytes = Convert.FromBase64String(base64Data);

            // Trỏ trực tiếp vào thư mục gốc của dự án
            var folderPath = Path.Combine(webRootPath, "uploads", subFolder);

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var fileName = $"{fileNamePrefix}_{Guid.NewGuid().ToString().Substring(0, 5)}.gif";
            var filePath = Path.Combine(folderPath, fileName);

            await File.WriteAllBytesAsync(filePath, bytes);

            // Trả về đường dẫn tương đối để lưu vào DB
            return $"/uploads/{subFolder}/{fileName}";
        }
    }
}