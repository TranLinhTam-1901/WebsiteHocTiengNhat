using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Grammars
    {
        [Key]
        public Guid GrammarID { get; set; }

        [Required]
        public string Title { get; set; }
        public string Structure { get; set; }
        public string Meaning { get; set; }
        public string Explanation { get; set; }
        public string Example { get; set; }
        public string ExampleMeaning { get; set; }

        // Khóa ngoại
        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }

        // Navigation properties
        [ForeignKey("LevelID")]
        public virtual JLPT_Level JLPTLevel { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}