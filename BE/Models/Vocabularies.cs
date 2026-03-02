using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Vocabularies
    {
        [Key]
        public Guid VocabID { get; set; } = Guid.NewGuid();
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }
        public string AudioURL { get; set; }
        public string Example { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topic Topic { get; set; }
    }
}