using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Admin.Question
{
    public class CreateQuestionDTO
    {
        public string Content { get; set; }
        public QuestionType QuestionType { get; set; } // Enum: MultipleChoice, Listening...
        public int Difficulty { get; set; }
        public string? AudioURL { get; set; }
        public string? MediaTimestamp { get; set; }
        public string? Explanation { get; set; }
        public Guid? EquivalentID { get; set; }
        public List<Guid> TopicIds { get; set; } = new List<Guid>();
        public Guid? SourceID { get; set; }
        public Guid LessonID { get; set; } // Thêm trường này để liên kết câu hỏi với bài học cụ thể
        public Status Status { get; set; } = Status.Published;
        
        public SkillType SkillType { get; set; } // Thêm trường này để xác định kỹ năng của câu hỏi
        public List<AnswerCreateDTO> Answers { get; set; } = new List<AnswerCreateDTO>();

    }

    public class AnswerCreateDTO
    {
        public string AnswerText { get; set; }
        public bool IsCorrect { get; set; }
    }
}