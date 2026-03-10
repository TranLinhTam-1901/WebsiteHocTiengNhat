namespace QuizzTiengNhat.DTOs.Admin
{
    public class VocabDTO
    {
        public Guid Id { get; set; }
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }
        public string WordType { get; set; }
        public bool IsCommon { get; set; }
        public string? Mnemonics { get; set; }
        public string? ImageURL { get; set; }
        public string? AudioURL { get; set; }
        public int Priority { get; set; }
        public int Status { get; set; }

        public string LevelName { get; set; }
        public string TopicName { get; set; }
        public string LessonName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Danh sách ví dụ (Thay cho Example/ExampleMeaning đơn lẻ)
        public List<ExampleDTO> Examples { get; set; } = new List<ExampleDTO>();

        // Danh sách Kanji liên quan
        public List<VocabRelatedKanjiDTO> RelatedKanjis { get; set; } = new List<VocabRelatedKanjiDTO>();

        public string DisplayWord => $"{Word} ({Reading})";
    }

    public class VocabRelatedKanjiDTO
    {
        public Guid KanjiID { get; set; }
        public string Character { get; set; }
        public string Meaning { get; set; }
    }
}