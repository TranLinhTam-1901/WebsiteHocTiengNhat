using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.Models
{
    public class WordTypes
    {
        [Key]
        public Guid WordTypeID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }         // Ví dụ: Noun, Verb Group 1, Adjective I...

        public string? Description { get; set; }  // Giải thích về loại từ này

        // Navigation property: Một loại từ có thể gắn cho nhiều từ vựng qua bảng trung gian
        public virtual ICollection<VocabWordTypes> VocabWordTypes { get; set; } = new List<VocabWordTypes>();
    }
}