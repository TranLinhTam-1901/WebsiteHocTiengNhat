using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Admin
{
    public class CreateUpdateListeningDTO
    {
        public string Title { get; set; }
        public string AudioURL { get; set; }
        public string? Script { get; set; }
        public string? Transcript { get; set; }
        public int Duration { get; set; }
        public string? SpeedCategory { get; set; }
        public int Status { get; set; }
        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }
        public Guid LessonID { get; set; }

        // Danh sách câu hỏi đi kèm
        public List<ListeningQuestionDTO> Questions { get; set; } = new List<ListeningQuestionDTO>();
    }

    public class ListeningQuestionDTO
    {
        public string Content { get; set; }
        public string? ImageURL { get; set; } // Hình ảnh cho mỗi câu hỏi
        public string? MediaTimestamp { get; set; }
        public string? Explanation { get; set; }
        public int Difficulty { get; set; }
        public int? DisplayOrder { get; set; }
        public QuestionType QuestionType { get; set; }

        // Danh sách đáp án cho từng câu hỏi
        public List<ListeningAnswerDTO> Answers { get; set; } = new List<ListeningAnswerDTO>();
    }

    public class ListeningAnswerDTO
    {
        public string AnswerText { get; set; }
        public bool IsCorrect { get; set; }
    }
}