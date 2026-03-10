using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public string? Formality { get; set; } // Trang trọng (Kính ngữ), Thân mật (Thể từ điển)...
        public string? SimilarGrammar { get; set; } // Gợi ý các ngữ pháp tương đương (Ví dụ: ~わけだ vs ~はずだ)
        public string? UsageNote { get; set; } // Lưu ý khi nào KHÔNG được dùng cấu trúc này
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Khóa ngoại
        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }

        // Navigation properties
        [ForeignKey("LevelID")]
        public virtual JLPT_Level JLPTLevel { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
        public virtual ICollection<Examples> Examples { get; set; } = new List<Examples>();
    }
}