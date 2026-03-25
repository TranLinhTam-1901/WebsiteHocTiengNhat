using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models.Enums;
namespace QuizzTiengNhat.Models
{
    public class Questions
    {
        [Key]
        public Guid QuestionID { get; set; }

        // --- THÊM DÒNG NÀY ---
        public Guid? ReadingID { get; set; } // Nullable vì không phải câu hỏi nào cũng thuộc bài đọc
        [ForeignKey("ReadingID")]
        public virtual Readings Reading { get; set; }
        public Guid? ListeningID { get; set; } // Nullable vì không phải câu hỏi nào cũng thuộc bài nghe
        [ForeignKey("ListeningID")]
        public virtual Listenings Listening { get; set; }
        // ---------------------
        public Guid LessonID { get; set; }
        // Navigation properties
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        public string Content { get; set; }
        public QuestionType QuestionType { get; set; } 
        public SkillType SkillType { get; set; }
        public string? AudioURL { get; set; }
        public string? ImageURL { get; set; }
        public int Difficulty { get; set; }
        public string? Explanation { get; set; }
        public Status Status { get; set; }

        public Guid? EquivalentID { get; set; } // Dùng cho các câu hỏi tương đương

        public string? MediaTimestamp { get; set; } // Lưu mốc thời gian bài nghe 

        public int? DisplayOrder { get; set; } // Thứ tự câu hỏi trong bài nghe/bài đọc

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // lưu vết nguồn gốc
        public Guid? SourceID { get; set; }
        public Guid? ParentID { get; set; } // Khóa ngoại tự tham chiếu cho câu hỏi con
        
        [ForeignKey("ParentID")]
        public virtual Questions ParentQuestion { get; set; } // Tham chiếu đến câu hỏi cha

        public virtual ICollection<Questions> SubQuestions { get; set; } = new List<Questions>(); // Tập hợp câu hỏi con

         public virtual ICollection<Answers> Answers { get; set; } = new List<Answers>(); // Liên kết với các đáp án
        
        // Liên kết với bảng trung gian Topic
        public virtual ICollection<Questions_Topic> QuestionTopics { get; set; } = new List<Questions_Topic>();
        public virtual ICollection<Exam_Questions> ExamQuestions { get; set; } = new List<Exam_Questions>();
    }
}
