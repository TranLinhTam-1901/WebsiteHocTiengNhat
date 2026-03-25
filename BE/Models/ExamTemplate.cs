using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models;
using System.ComponentModel.DataAnnotations;
using QuizzTiengNhat.Models.Enums;

public class ExamTemplate {

    [Key]
    public Guid TemplateID { get; set; }
    public string Title { get; set; }
    public Guid LevelID { get; set; }
    public int Duration { get; set; } // Phút
    [Column(TypeName = "decimal(18,2)")]
    public decimal PassingScore { get; set; } 
    public double MinLanguageKnowledgeScore { get; set; }
    public double? MinReadingScore { get; set; }
    public double? MinListeningScore { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalMaxScore { get; set; }
    public virtual ICollection<ExamTemplateDetail> Details { get; set; }

    [ForeignKey("LevelID")]
    public virtual JLPT_Level JLPTLevel { get; set; }
    
}