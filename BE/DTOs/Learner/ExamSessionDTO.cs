public class SaveExamProgressDTO
{
    public Guid SessionID { get; set; }

    // public int RemainingTime { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public int DurationMinutes { get; set; }

    public List<SaveExamAnswerDTO> Answers { get; set; }
}

public class SaveExamAnswerDTO
{
    public Guid QuestionID { get; set; }

    public Guid? SelectedAnswerID { get; set; }

    public string? TextAnswer { get; set; }

    public int ResponseTime { get; set; }
}