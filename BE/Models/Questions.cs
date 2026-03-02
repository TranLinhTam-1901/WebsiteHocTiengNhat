using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models.Enums;
namespace QuizzTiengNhat.Models
{
    public class Questions
    {
        [Key]
        public Guid QuestionID { get; set; }
        public Guid LessonID { get; set; }
        public string Content { get; set; }
        public QuestionType QuestionType { get; set; } 
        public string AudioURL { get; set; }
        public int Difficulty { get; set; }
        public string Explanation { get; set; }
        public QuestionStatus Status { get; set; } 

        public Guid? EquivalentID { get; set; } // Dùng cho các câu hỏi tương đương

        public string MediaTimestamp { get; set; } // Lưu mốc thời gian bài nghe 

        // lưu vết nguồn gốc
         public Guid? SourceID { get; set; }
        public Guid? ParentID { get; set; } // Khóa ngoại tự tham chiếu cho câu hỏi con
        // Navigation properties
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        [ForeignKey("ParentID")]
        public virtual Questions ParentQuestion { get; set; } // Tham chiếu đến câu hỏi cha

        public virtual ICollection<Questions> SubQuestions { get; set; } = new List<Questions>(); // Tập hợp câu hỏi con

         public virtual ICollection<Answers> Answers { get; set; } = new List<Answers>(); // Liên kết với các đáp án
        
        // Liên kết với bảng trung gian Topic
        public virtual ICollection<Questions_Topic> QuestionTopics { get; set; } = new List<Questions_Topic>();
    }
}
