using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Kanjis
    {
        [Key]
        public Guid KanjiID { get; set; }
        [Required]
        public string Character { get; set; }
        public string Onyomi { get; set; }
        public string Kunyomi { get; set; }
        public string Meaning { get; set; }
        public int StrokeCount { get; set; }
        public string? StrokeGif { get; set; }

        // --- SỬA CHỖ NÀY ---
        public Guid RadicalID { get; set; }
        [ForeignKey("RadicalID")]
        public virtual Radicals Radical { get; set; }
        // -------------------

        public string? SearchVector { get; set; }
        public string? Note { get; set; }
        public string? Mnemonics { get; set; }
        public int Popularity { get; set; }
        public int Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid LevelID { get; set; }
        public Guid TopicID { get; set; }
        public Guid LessonID { get; set; }

        [ForeignKey("LevelID")]
        public virtual JLPT_Level JLPTLevel { get; set; }

        [ForeignKey("LessonID")]
        public virtual Lessons Lesson { get; set; }

        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }

        public virtual ICollection<VocabularyKanjis> RelatedVocabularies { get; set; } = new List<VocabularyKanjis>();
    }
}