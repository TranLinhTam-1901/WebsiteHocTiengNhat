using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Models
{
    public class Grammars
    {
        [Key]
        public Guid GrammarID { get; set; }

        [Required]
        public string Title { get; set; }
        public string Structure { get; set; }
        public string Meaning { get; set; }
        public string Explanation { get; set; }

        // --- SỬA CHỖ NÀY ---
        public GrammarCategory GrammarType { get; set; } // Ví dụ: "Trợ từ", "Thể Te", "Thể Ta"...
        public FormalityLevel Formality { get; set; } // Dùng Enum (Polite, Casual...)

        public Guid? GrammarGroupID { get; set; } // Khóa ngoại nối tới bảng GrammarGroups
        [ForeignKey("GrammarGroupID")]
        public virtual GrammarGroups GrammarGroup { get; set; }
        // -------------------

        public string? UsageNote { get; set; }
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid LevelID { get; set; }
        public Guid LessonID { get; set; }

        [ForeignKey("LevelID")]
        public virtual JLPT_Level JLPTLevel { get; set; }

        public virtual ICollection<GrammarTopics> GrammarTopics { get; set; } = new List<GrammarTopics>();

        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }


        public virtual ICollection<Examples> Examples { get; set; } = new List<Examples>();
    }
}