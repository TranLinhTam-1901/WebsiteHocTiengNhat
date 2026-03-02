using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Courses
    {
        [Key]
        public Guid CourseID { get; set; } = Guid.NewGuid();
        [Required]
        public string CourseName { get; set; }
        public string Description { get; set; }

        [ForeignKey("JLPT_Level")]
        public Guid LevelID { get; set; }
        public virtual JLPT_Level Level { get; set; }

        public virtual ICollection<Lessons> Lessons { get; set; } = new List<Lessons>();
    }
}