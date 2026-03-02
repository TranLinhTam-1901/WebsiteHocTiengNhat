using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Grammars
    {
        [Key]
        public Guid GrammarID { get; set; } = Guid.NewGuid();
        public string Title { get; set; }
        public string Structure { get; set; }
        public string Explanation { get; set; }
        public string Example { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topic Topic { get; set; }
    }
}