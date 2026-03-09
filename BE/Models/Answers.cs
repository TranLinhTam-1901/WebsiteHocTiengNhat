using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Answers
    {
        [Key]
        public Guid AnswerID { get; set; }

        public Guid QuestionID { get; set; }

        [Required]
        public string AnswerText { get; set; }

        public bool IsCorrect { get; set; }

        // Thiết lập mối quan hệ ngược lại với bảng Questions
        [ForeignKey("QuestionID")]
        public virtual Questions Question { get; set; }
    }
}