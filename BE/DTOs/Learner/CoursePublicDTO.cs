namespace QuizzTiengNhat.DTOs.Learner
{
    public class CoursePublicDTO
    {
        public Guid CourseID { get; set; }
        public string CourseName { get; set; }
        public string? Description { get; set; }
        public Guid LevelID { get; set; }
        public string LevelName { get; set; }
        public int LessonCount { get; set; }
    }
}
