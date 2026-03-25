using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

public class GenerateExamRequestDTO
{
    public string Title { get; set; }
    public int Duration { get; set; }
    public Guid LevelID { get; set; }
    public ExamType Type { get; set; } // MockTest, Lesson, Skill
    public Guid? LessonID { get; set; }
    public bool ShowResultImmediately { get; set; }
    
    // Các mốc điểm đỗ/liệt
    [Column(TypeName = "decimal(18,2)")]
    public decimal PassingScore { get; set; }
    public double MinLanguageKnowledgeScore { get; set; }
    public double MinReadingScore { get; set; }
    public double MinListeningScore { get; set; }

    // Chi tiết cấu trúc để bốc câu hỏi
    public List<ExamPartConfigDTO> Parts { get; set; }
}