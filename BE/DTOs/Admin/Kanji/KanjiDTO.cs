namespace QuizzTiengNhat.DTOs.Admin.Kanji
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

        // --- SỬA CHỖ NÀY: Trả về thông tin từ bảng Radicals ---
        public Guid RadicalID { get; set; }
        public string RadicalChar { get; set; } // Ví dụ: 氵
        public string RadicalName { get; set; } // Ví dụ: Thủy
        // ---------------------------------------------------

        public string? Mnemonics { get; set; }
        public int Popularity { get; set; }
        public string? Note { get; set; }

        // SỬA: Kiểu dữ liệu Status nên để int hoặc string tùy cách bạn Map từ Enum
        public int Status { get; set; }

        public string LevelName { get; set; }
        public string TopicName { get; set; }
        public string LessonName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

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