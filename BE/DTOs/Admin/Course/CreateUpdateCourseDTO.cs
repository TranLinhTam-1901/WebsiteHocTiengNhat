namespace QuizzTiengNhat.DTOs.Admin.Course
{
    public class CreateUpdateCourseDTO
    {
        public string CourseName { get; set; }
        public string Description { get; set; }
        public Guid LevelID { get; set; }
    }
}
