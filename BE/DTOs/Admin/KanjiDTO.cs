namespace QuizzTiengNhat.DTOs.Admin
{
    public class KanjiDTO
    {
        public Guid Id { get; set; }
        public string Character { get; set; }
        public string Onyomi { get; set; }
        public string Kunyomi { get; set; }
        public string Meaning { get; set; }
        public int StrokeCount { get; set; }
        public string? StrokeGif { get; set; }
        public string Radical { get; set; }

        // --- Các trường mới bổ sung ---
        public string? Mnemonics { get; set; }
        public int Popularity { get; set; }
        public string? Note { get; set; }
        public int Status { get; set; }

        public string LevelName { get; set; }
        public string TopicName { get; set; }
        public string LessonName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Danh sách từ vựng liên quan (Nếu cần hiển thị ở chi tiết Kanji)
        public List<RelatedVocabDTO> RelatedVocabularies { get; set; } = new List<RelatedVocabDTO>();

        public string Furigana => $"{Onyomi} ・ {Kunyomi}";
    }

    public class RelatedVocabDTO
    {
        public Guid VocabID { get; set; }
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }
    }
}