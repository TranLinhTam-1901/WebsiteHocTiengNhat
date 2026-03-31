using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Reading
{
    public class CreateUpdateReadingDTO
    {
        [Required]
        public string Title { get; set; }
        [Required]
        public string Content { get; set; }
        public string Translation { get; set; }
        public int WordCount { get; set; }
        public int EstimatedTime { get; set; } // Phút
        public int Status { get; set; } // 0: Draft, 1: Active

        [Required(ErrorMessage = "Vui lòng chọn trình độ")]
        public Guid LevelID { get; set; }

        [MinLength(1, ErrorMessage = "Vui lòng chọn ít nhất một chủ đề")]
        public List<Guid> TopicIDs { get; set; } = new List<Guid>();

        [Required(ErrorMessage = "Vui lòng chọn bài học")]
        public Guid LessonID { get; set; }

        public List<ReadingQuestionDTO> Questions { get; set; } = new();
    }

    public class ReadingQuestionDTO
    {
        public string Content { get; set; }
        public string Explanation { get; set; }
        public int Difficulty { get; set; }
        public List<ReadingAnswerDTO> Answers { get; set; } = new();
    }

    public class ReadingAnswerDTO
    {
        public string AnswerText { get; set; }
        public bool IsCorrect { get; set; }
    }
}