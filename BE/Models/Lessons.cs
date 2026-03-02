using System.ComponentModel.DataAnnotations;
using QuizzTiengNhat.Models.Enums;
namespace QuizzTiengNhat.Models
{
    public class Lessons
    {
        [Key]
        public Guid LessonsID { get; set; }
        
        public Guid CourseID { get; set; }
        public string Title { get; set; }
        public SkillType SkillType { get; set; } // Vocabulary, Grammar...
        public int Difficulty { get; set; }
        public int Priority { get; set; }

        // Navigation properties
       public virtual Courses Course { get; set; }  = new Courses();
        public virtual ICollection<Progress> Progresses { get; set; }
        public virtual ICollection<Questions> Questions { get; set; }
        public virtual ICollection<Lessons_Topic> LessonTopics { get; set; } = new List<Lessons_Topic>(); // Kiểu "n"
    }
}
