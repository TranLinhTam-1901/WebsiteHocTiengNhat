using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
public class Exam_Sessions
{
    [Key]
    public Guid SessionID { get; set; }

    public string UserID { get; set; }

    public Guid ExamID { get; set; }

    // thời gian còn lại
    public int RemainingTime { get; set; }

    // đang làm / đã submit / abandoned
    public SessionStatus Status { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime LastAccessedAt { get; set; }

    // version đề
    public int ExamVersion { get; set; }

    [ForeignKey("ExamID")]
    public virtual Exams Exam { get; set; }

    public virtual ICollection<Exam_Session_Answers> Answers { get; set; }
    
}