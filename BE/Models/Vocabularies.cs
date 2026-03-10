using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models.Enums; // Giả sử bạn để Enum trong đây

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

        // Thêm các thuộc tính mới
        public string WordType { get; set; }
        public bool IsCommon { get; set; } = false; // Đánh dấu từ vựng hay xuất hiện (Core 2k, 6k)
        public string? Mnemonics { get; set; } // Câu thần chú để nhớ từ
        public string? ImageURL { get; set; } // Hình ảnh minh họa cho từ vựng (UX cực tốt cho trí nhớ)
        public int Priority { get; set; }
        public int Status { get; set; } // 0: Draft, 1: Active, 2: Hidden

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }
        public Guid LessonID { get; set; }
        public string? AudioURL { get; set; }

        // Navigation Properties
        [ForeignKey("LevelID")]
        public virtual JLPT_Level JLPTLevel { get; set; }

        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }

        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        // Một từ vựng có NHIỀU ví dụ
        public virtual ICollection<Examples> Examples { get; set; } = new List<Examples>();

        // Liên kết với Kanji (Nhiều - Nhiều)
        public virtual ICollection<VocabularyKanjis> RelatedKanjis { get; set; } = new List<VocabularyKanjis>();
    }
}