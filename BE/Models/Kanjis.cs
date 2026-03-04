using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Kanjis
    {
        [Key]
        public Guid KanjiID { get; set; }
        [Required]
        public string Character { get; set; }    // 食
        public string Onyomi { get; set; }       // ショク
        public string Kunyomi { get; set; }      // た.べる
        public string Meaning { get; set; }      // Thực (ăn)
        public int StrokeCount { get; set; }
        public string Radical { get; set; }      // Bộ thủ

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