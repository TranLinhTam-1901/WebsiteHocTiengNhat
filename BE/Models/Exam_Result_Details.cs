using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Models
{
    public class Exam_Result_Details
    {
        [Key]
        public Guid ResultDetailID { get; set; }

        public Guid ResultID { get; set; }
        [ForeignKey("ResultID")]
        public virtual Exam_Results Result { get; set; }

        public Guid QuestionID { get; set; }
        [ForeignKey("QuestionID")]
        public virtual Questions Question { get; set; }

        public bool IsCorrect { get; set; }
        public int ResponseTime { get; set; }

        public Guid? TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }

        public SkillType? SkillType { get; set; }
        
        public Guid? SelectedAnswerID { get; set; }

        public string? TextAnswer { get; set; }

        public Guid? ReadingID { get; set; }
        [ForeignKey("ReadingID")]
        public virtual Readings Reading { get; set; }

        public Guid? ListeningID { get; set; }
        [ForeignKey("ListeningID")]
        public virtual Listenings Listening { get; set; }

        public Guid? ExamQuestionID { get; set; }
        [ForeignKey("ExamQuestionID")]
        public virtual Exam_Questions ExamQuestion { get; set; }
    }
}
