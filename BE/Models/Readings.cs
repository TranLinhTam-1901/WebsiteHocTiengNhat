using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Readings
    {
        [Key]
        public Guid ReadingID { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Content { get; set; } // Đoạn văn bản đọc hiểu
        public string Translation { get; set; }
        public int WordCount { get; set; } // Tổng số chữ trong bài (để tính tốc độ đọc)
        public int EstimatedTime { get; set; } // Thời gian làm bài dự kiến (phút)
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

        // Một bài đọc có thể có nhiều câu hỏi liên quan
        public virtual ICollection<Questions> Questions { get; set; }
    }
}