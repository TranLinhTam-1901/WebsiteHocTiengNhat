using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Exam_Questions
    {
        [Key]
        public Guid ExamQuestionID { get; set; } = Guid.NewGuid();

        public Guid ExamID { get; set; }
        [ForeignKey("ExamID")]
        public virtual Exams Exam { get; set; }

        public Guid QuestionID { get; set; }
        [ForeignKey("QuestionID")]
        public virtual Questions Question { get; set; }

        // Thứ tự hiển thị câu hỏi trong đề bài
        public int OrderIndex { get; set; }

        // Điểm số của riêng câu hỏi này trong bài thi này 
        // (Ví dụ: Câu đọc hiểu có thể 5 điểm, câu từ vựng 1 điểm)
        [Column(TypeName = "decimal(18,2)")]
        public decimal Score { get; set; } 
    }
}