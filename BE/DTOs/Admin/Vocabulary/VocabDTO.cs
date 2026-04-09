namespace QuizzTiengNhat.DTOs.Admin.Vocabulary
{
    public class VocabDTO
    {
        public Guid Id { get; set; }
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }

        // --- SỬA CHỖ NÀY: Trả về danh sách các loại từ ---
        public List<WordTypeDTO> WordTypes { get; set; } = new List<WordTypeDTO>();
        // -----------------------------------------------

        public bool IsCommon { get; set; }
        public string? Mnemonics { get; set; }
        public string? ImageURL { get; set; }
        public string? AudioURL { get; set; }
        public int Priority { get; set; }
        public int Status { get; set; }

        public string LevelName { get; set; }
        public List<TopicDTO> Topics { get; set; } = new List<TopicDTO>();
        public string LessonName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<VocabExampleDTO> Examples { get; set; } = new List<VocabExampleDTO>();
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