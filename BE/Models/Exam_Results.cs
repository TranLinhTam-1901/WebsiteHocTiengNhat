using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Exam_Results
    {
        [Key]
        public Guid ResultID { get; set; }
        public string UserID { get; set; }
        public Guid ExamID { get; set; }
        public float Score { get; set; }
        public int TimeSpent { get; set; }
        public DateTime CreatedAt { get; set; }

        // kết quả này thuộc về version nào của đề
        public int ExamVersion { get; set; }
        // Navigation properties
        public virtual ApplicationUser User { get; set; }

        [ForeignKey("ExamID")]
        public virtual Exams Exam { get; set; }

        public virtual ICollection<Exam_Result_Details> ResultDetails { get; set; } = new List<Exam_Result_Details>();
    }
}
