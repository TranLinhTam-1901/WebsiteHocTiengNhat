public class ExamTemplateResponseDTO
{
    public string Title { get; set; }
    public int Duration { get; set; }
    public decimal PassingScore { get; set; }
    
    public double MinLanguageKnowledgeScore { get; set; }
    public double? MinReadingScore { get; set; }
    public double? MinListeningScore { get; set; }

   
    public List<ExamPartConfigDTO> Details { get; set; } 
}