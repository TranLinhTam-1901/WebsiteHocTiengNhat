using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Admin.Grammar
{
    public class GrammarDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Structure { get; set; }
        public string Meaning { get; set; }
        public string Explanation { get; set; }
        public GrammarCategory GrammarType { get; set; } // Phân loại: Trợ từ, Thể Te...

        // --- SỬA CHỖ NÀY ---
        public int Formality { get; set; } // Trả về giá trị int của Enum FormalityLevel
        public Guid? GrammarGroupID { get; set; } // ID nhóm tương đồng
        public string? GrammarGroupName { get; set; } // Tên nhóm để hiển thị
        // -------------------

        public string? UsageNote { get; set; }
        public int Status { get; set; }

        public string LevelName { get; set; }
        public List<TopicDTO> Topics { get; set; } = new List<TopicDTO>();
        public string LessonName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<GrammarExampleDTO> Examples { get; set; } = new List<GrammarExampleDTO>();

        public string DisplayTitle => $"{Title} — {Structure}";
    }
}