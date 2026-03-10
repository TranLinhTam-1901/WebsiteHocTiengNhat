namespace QuizzTiengNhat.DTOs.Admin
{
    public class GrammarDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Structure { get; set; }
        public string Meaning { get; set; }
        public string Explanation { get; set; }

        // --- Thêm các thuộc tính UX mới ---
        public string? Formality { get; set; }
        public string? SimilarGrammar { get; set; }
        public string? UsageNote { get; set; }
        public int Status { get; set; }

        public string LevelName { get; set; }
        public string TopicName { get; set; }
        public string LessonName { get; set; }

        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }
        public Guid LessonID { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // --- QUAN TRỌNG: Thay thế Example cũ bằng danh sách List ---
        public List<ExampleDTO> Examples { get; set; } = new List<ExampleDTO>();

        public string DisplayTitle => $"{Title} — {Structure}";
    }

    // Class phụ để hứng dữ liệu ví dụ
    public class ExampleDTO
    {
        public Guid ExampleID { get; set; }
        public string Content { get; set; }
        public string Translation { get; set; }
        public string? AudioURL { get; set; }
    }
}