using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Exam_Session_Answers
{
    [Key]
    public Guid SessionAnswerID { get; set; }

    public Guid SessionID { get; set; }

    [ForeignKey("SessionID")]
    public virtual Exam_Sessions Session { get; set; }

    public Guid QuestionID { get; set; }

    public Guid? SelectedAnswerID { get; set; }

    public string? TextAnswer { get; set; }

    public int ResponseTime { get; set; }

    public DateTime UpdatedAt { get; set; }
}