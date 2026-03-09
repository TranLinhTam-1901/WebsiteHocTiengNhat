using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class Examples
    {
        [Key]
        public Guid ExampleID { get; set; }

        [Required]
        public string Content { get; set; } // "田中さんは[公園]{こうえん}で..." (Dùng syntax Furigana của bạn)

        [Required]
        public string Translation { get; set; } // Nghĩa câu ví dụ

        public string? AudioURL { get; set; } // File nghe riêng cho câu này (nếu có)

        // Khóa ngoại linh hoạt
        public Guid? VocabID { get; set; }
        [ForeignKey("VocabID")]
        public virtual Vocabularies? Vocabulary { get; set; }

        public Guid? GrammarID { get; set; }
        [ForeignKey("GrammarID")]
        public virtual Grammars? Grammar { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}