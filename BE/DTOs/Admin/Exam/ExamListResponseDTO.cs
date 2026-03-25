using System;
using QuizzTiengNhat.Models.Enums;

public class ExamListResponseDTO {
    public Guid ExamID { get; set; }
    public string Title { get; set; }
    public string LevelName { get; set; } // Map từ JLPT_Levels
    public ExamType Type { get; set; } // "Chính thức", "Theo bài", "Theo kỹ năng"
    public string LessonTitle { get; set; } // null nếu là đề tổng hợp
    public int TotalQuestions { get; set; } // Count từ Exam_Questions
    public double TotalScore { get; set; } // Sum Score từ Exam_Questions
    public int Duration { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsPublished { get; set; }
}