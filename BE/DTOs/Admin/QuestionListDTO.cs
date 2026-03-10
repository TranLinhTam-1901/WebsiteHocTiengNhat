using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Admin
{
    public class QuestionListDTO
    {
        public Guid QuestionID { get; set; }
        public string Content { get; set; }
        public QuestionType QuestionType { get; set; }
        public int Difficulty { get; set; }
        public QuestionStatus Status { get; set; }
        
        // Các trường bổ sung dành riêng cho giao diện Danh sách
        public bool HasAudio { get; set; } 
        public int LinkedCount { get; set; } 
        public string LessonName { get; set; } 
        public DateTime? CreatedAt { get; set; } // Nếu bạn muốn sắp xếp theo thời gian
    }
}