using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Kanjis
    {
        [Key]
        public Guid KanjiID { get; set; } = Guid.NewGuid();
        public string Character { get; set; }
        public string Onyomi { get; set; }
        public string Kunyomi { get; set; }
        public string Meaning { get; set; }

        public Guid LessonID { get; set; }
        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }
    }
}