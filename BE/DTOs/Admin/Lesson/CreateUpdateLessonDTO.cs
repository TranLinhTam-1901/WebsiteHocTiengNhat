using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Admin.Lesson
{
    public class CreateUpdateLessonDTO
    {
        public Guid CourseID { get; set; }
        public string Title { get; set; }
       
        public int Priority { get; set; }
    }
}
