using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class UserAnswerHistory
    {
        [Key]
        public Guid HistoryID { get; set; }
        public string UserID { get; set; }
        public Guid QuestionID { get; set; }
        public Guid? SelectedAnswerID { get; set; } // Đáp án user chọn
        public string? TextAnswer { get; set; }
        public bool IsCorrect { get; set; }
        public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

        // Quan trọng cho AI: Thời gian suy nghĩ (giây)
        // Nếu làm đúng nhưng mất 60s -> Chưa thuộc kỹ.
        // Nếu làm sai trong 2s -> Chọn bừa/Phản xạ sai.
        public int TimeTaken { get; set; }

        [ForeignKey("UserID")]
        public virtual ApplicationUser User { get; set; }
        [ForeignKey("QuestionID")]
        public virtual Questions Question { get; set; }
    }
}
