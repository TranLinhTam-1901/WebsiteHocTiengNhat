
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Learner
{
    // DTO trả về đề thi cho người dùng làm (Ẩn IsCorrect)
    public class ExamDisplayDTO
    {
        public Guid ExamID { get; set; }
        public string Title { get; set; }
        public int Duration { get; set; }
         
        public int Version { get; set; } 
        public List<QuestionDisplayDTO> Questions { get; set; } = new List<QuestionDisplayDTO>();
    }

    public class QuestionDisplayDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; }
        public string? ImageURL { get; set; }
        public string? AudioURL { get; set; }
        public string? MediaTimestamp { get; set; }
        public int? DisplayOrder { get; set; }
        public QuestionType QuestionType { get; set; }
        
        // Nội dung bài đọc/nghe đi kèm
        public string? ReadingContent { get; set; }
        public string? ListeningScript { get; set; }

        public List<AnswerOptionDTO> Options { get; set; } = new List<AnswerOptionDTO>();
        public List<SubQuestionDTO> SubQuestions { get; set; } = new List<SubQuestionDTO>();
    }

    public class SubQuestionDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; }
        public List<AnswerOptionDTO> Options { get; set; } = new List<AnswerOptionDTO>();
    }

    public class AnswerOptionDTO
    {
        public Guid AnswerID { get; set; }
        public string AnswerText { get; set; }
    }

    // DTO nhận dữ liệu nộp bài
    public class SubmitExamRequestDTO
    {
        public Guid ExamID { get; set; }
        public int TotalTimeSpent { get; set; }
        public List<UserAnswerSelectionDTO> Answers { get; set; } = new();
    }

    public class UserAnswerSelectionDTO
    {
        public Guid QuestionID { get; set; }
        public Guid? SelectedAnswerID { get; set; }
        public string? TextAnswer { get; set; }
        public int ResponseTime { get; set; } // Thời gian làm riêng câu này
    }

    public class SubmitExamResultDTO
    {
        public Guid ResultID { get; set; }
        public Guid ExamID { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public int ExamDuration { get; set; }
        public float Score { get; set; }
        public int CorrectAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public int TimeSpent { get; set; }
        public List<ExamReviewQuestionDTO> Questions { get; set; } = new();
    }

    public class ExamReviewQuestionDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int ResponseTime { get; set; }
        public Guid? SelectedAnswerID { get; set; }
        public string? SelectedAnswerText { get; set; }
        public Guid? CorrectAnswerID { get; set; }
        public string? CorrectAnswerText { get; set; }
    }
}