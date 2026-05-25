using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Admin.Lesson
{
    public class LessonDTO
    {
        public Guid LessonID { get; set; }
        public Guid CourseID { get; set; }
        public string CourseName { get; set; }
        public string Title { get; set; }
       
        public int Priority { get; set; }
        public int QuestionCount { get; set; }
    }
}
