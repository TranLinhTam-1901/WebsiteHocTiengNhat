using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Vocabularies
    {
        [Key]
        public Guid VocabID { get; set; }
        [Required]
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }

        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }

        public string Example { get; set; }
        public string ExampleMeaning { get; set; }
        public string? AudioURL { get; set; }

        [ForeignKey("LevelID")] // Ép EF dùng đúng cột LevelID
        public virtual JLPT_Level JLPTLevel { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        [ForeignKey("TopicID")] // Ép EF dùng đúng cột TopicID
        public virtual Topics Topic { get; set; }
    }
}