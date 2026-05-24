using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Vocabularies
    {
        [Key]
        public Guid VocabID { get; set; }

        [Required]
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }

        // --- SỬA CHỖ NÀY: Xóa WordType string, thay bằng Collection ---
        public virtual ICollection<VocabWordTypes> VocabWordTypes { get; set; } = new List<VocabWordTypes>();
        // NHIỀU TOPIC (Many-to-Many) - Sửa tại đây
        public virtual ICollection<VocabTopics> VocabTopics { get; set; } = new List<VocabTopics>();

        public bool IsCommon { get; set; } = false;
        public string? Mnemonics { get; set; }
        public string? ImageURL { get; set; }
        public int Priority { get; set; }
        public int Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid LevelID { get; set; }
        public Guid LessonID { get; set; }
        public string? AudioURL { get; set; }

        [ForeignKey("LevelID")]
        public virtual JLPT_Level JLPTLevel { get; set; }

        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        public virtual ICollection<Examples> Examples { get; set; } = new List<Examples>();
        public virtual ICollection<VocabularyKanjis> RelatedKanjis { get; set; } = new List<VocabularyKanjis>();
    }
}