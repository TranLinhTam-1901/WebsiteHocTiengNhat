using System.ComponentModel.DataAnnotations.Schema;

public class UpdateExamRequestDTO
{
   
    public string Title { get; set; }

    public int Duration { get; set; }

   [Column(TypeName = "decimal(18,2)")]
    public decimal PassingScore { get; set; }
    
    // Các mốc điểm liệt
    public double MinLanguageKnowledgeScore { get; set; }
    public double MinReadingScore { get; set; }
    public double MinListeningScore { get; set; }

    public bool ShowResultImmediately { get; set; }
}