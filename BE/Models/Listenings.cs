using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Listenings
    {
        [Key]
        public Guid ListeningID { get; set; } = Guid.NewGuid();
        public string Title { get; set; }
        public string AudioURL { get; set; }
        public string Transcript { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topic Topic { get; set; }
    }
}