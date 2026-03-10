using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Listenings
    {
        [Key]
        public Guid ListeningID { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string AudioURL { get; set; }

        public string? Script { get; set; } // Lời thoại (optional)
        public string? Transcript { get; set; }
        public int Duration { get; set; } // Độ dài file audio (giây) - dùng để hiển thị thanh Progress
        public string? SpeedCategory { get; set; } // Tốc độ nói: Chậm, Bình thường, Nhanh (Dành cho luyện nghe)
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

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

        // Một bài nghe có thể có nhiều câu hỏi liên quan
        public virtual ICollection<Questions> Questions { get; set; }
    }
}