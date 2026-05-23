
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Learner
{
    // DTO trả về đề thi cho người dùng làm (Ẩn IsCorrect)
    public class ExamDisplayDTO
    {
        public Guid ExamID { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Duration { get; set; }
         
        public int Version { get; set; } 
        // public List<QuestionDisplayDTO> Questions { get; set; } = new List<QuestionDisplayDTO>();
        public List<ExamTreeItemDTO> Sections { get; set; } = [];
    }

    public class ExamStructuredDTO
    {
        public Guid ExamID { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Duration { get; set; }
        public int Version { get; set; }
        public List<ExamSectionDTO> Sections { get; set; } = new List<ExamSectionDTO>();
    }

    public class ExamSectionDTO
    {
        public SkillType SkillType { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public List<JLPTPartDTO> Parts { get; set; } = [];
    }

    public class JLPTPartDTO
    {
        public string PartKey { get; set; } = string.Empty;

        public string PartName { get; set; } = string.Empty;

        public int TotalQuestions { get; set; }
        public bool HasSharedContent { get; set; }
        public QuestionFormat QuestionFormat { get; set; }

        public List<QuestionDisplayDTO> Questions { get; set; } = [];
    }

    public class QuestionDisplayDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageURL { get; set; }
        public string? AudioURL { get; set; }
        public string? MediaTimestamp { get; set; }
        public int? DisplayOrder { get; set; }
        public QuestionType QuestionType { get; set; }
        public QuestionFormat QuestionFormat { get; set; }
        public int TotalSubQuestions { get; set; }
        // Nội dung bài đọc/nghe đi kèm
        public string? ReadingContent { get; set; }
        public string? ListeningScript { get; set; }

        public List<AnswerOptionDTO> Options { get; set; } = new List<AnswerOptionDTO>();
        public List<SubQuestionDTO> SubQuestions { get; set; } = new List<SubQuestionDTO>();
    }


    public class ExamTreeItemDTO
    {
        public string Type { get; set; } = string.Empty;

        public Guid QuestionID { get; set; }

        public string SkillType { get; set; } = string.Empty;

        // parent shared content
        public string? Content { get; set; }

        public string? AudioUrl { get; set; }

        public string? Script { get; set; }

        public string? ImageURL { get; set; }

        public int? OrderIndex { get; set; }

        public decimal? Score { get; set; }

        // dùng cho Normal
        public List<AnswerOptionDTO> Options { get; set; } = [];

        // dùng cho Reading / Listening
        public List<QuestionDisplayDTO> SubQuestions { get; set; } = [];
    }

    public class SubQuestionDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<AnswerOptionDTO> Options { get; set; } = new List<AnswerOptionDTO>();
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

        public bool? IsPassed { get; set; }
        public float? PassingScore { get; set; }
        public List<ExamResultSectionScoreDTO>? SectionScores { get; set; }
        public List<ExamReviewTreeItemDTO> Sections { get; set; } = [];

    }

    public class ExamResultSectionScoreDTO
    {
        public string SectionName { get; set; } = string.Empty;

        public float Score { get; set; }

        public float MinScore { get; set; }

        public int CorrectAnswers { get; set; }

        public int TotalQuestions { get; set; }

        public bool IsPassed { get; set; }
    }
    public class ExamReviewTreeItemDTO
    {
        public string Type { get; set; } = string.Empty;

        public string SkillType { get; set; } = string.Empty;

        // parent content hoặc normal question content
        public string? Content { get; set; }

        public string? AudioUrl { get; set; }

        public string? Script { get; set; }

        public string? ImageURL { get; set; }

        public int? OrderIndex { get; set; }

        public decimal? Score { get; set; }

        // dùng cho Normal
        public Guid? QuestionID { get; set; }

        public bool? IsCorrect { get; set; }

        public int? ResponseTime { get; set; }

        public List<AnswerOptionDTO> Answers { get; set; } = [];

        // dùng cho Reading / Listening
        public List<ExamReviewQuestionDTO> SubQuestions { get; set; } = [];
    }
    public class ExamReviewQuestionDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int ResponseTime { get; set; }
        public List<AnswerOptionDTO> Answers { get; set; } = [];

        // optional cho JLPT
        public string? Explanation { get; set; }

        public string? AudioUrl { get; set; }

        public string? ImageUrl { get; set; }

        // support reading/listening group
        public Guid? ParentQuestionID { get; set; }

        public List<ExamReviewQuestionDTO>? SubQuestions { get; set; }
    }

     public class AnswerOptionDTO
    {
        public Guid AnswerID { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public bool IsSelected { get; set; }
    }

    //Dùng cho JLPT, hiển thị điểm liệt từng phần
    public class ExamListItemDTO
    {
        public Guid ExamID { get; set; }

        public string Title { get; set; } = null!;

        public string LevelName { get; set; } = null!;

        public int Duration { get; set; }

        public decimal TotalScore { get; set; }

        public decimal PassingScore { get; set; }

        public int TotalQuestions { get; set; }

        public ExamType ExamType { get; set; }

        public int Version { get; set; }

        public bool ShowResultImmediately { get; set; }
    }

    public class ExamSummaryDTO
    {
        public Guid ExamID { get; set; }

        public string Title { get; set; } = null!;
        public string LevelName { get; set; } = null!;

        public int Duration { get; set; }

        public int TotalQuestions { get; set; }

        public decimal TotalScore { get; set; }

        public decimal PassingScore { get; set; }

        public MinScoreDTO MinScores { get; set; } = null!;

        public List<ExamSectionSummaryDTO> Sections { get; set; } = [];
    }
    public class MinScoreDTO
    {
        public int Language { get; set; }

        public int Reading { get; set; }

        public int Listening { get; set; }
    }

    public class ExamSectionSummaryDTO
    {
        public SkillType SkillType { get; set; }

        public string SkillName { get; set; } = null!;

        public int TotalQuestions { get; set; }

        public decimal TotalPoints { get; set; }
    }

   
}