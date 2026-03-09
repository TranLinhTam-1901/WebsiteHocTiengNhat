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
        public string? StrokeGif { get; set; }
        public string Radical { get; set; }      // Bộ thủ
        public string? SearchVector { get; set; }
        public string? Note { get; set; }
        public string? Mnemonics { get; set; } // Câu thần chú để nhớ từ
        public int Popularity { get; set; } // Thứ hạng phổ biến (Ví dụ: Top 100, Top 500 chữ Kanji hay dùng)
        public int Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

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
        // Thêm dòng này vào trong class Kanjis hiện tại của bạn
        public virtual ICollection<VocabularyKanjis> RelatedVocabularies { get; set; } = new List<VocabularyKanjis>();
    }
}