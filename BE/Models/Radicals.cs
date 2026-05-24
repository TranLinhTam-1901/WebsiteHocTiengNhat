using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.Models
{
    public class Radicals
    {
        [Key]
        public Guid RadicalID { get; set; }

        [Required]
        [MaxLength(10)]
        public string Character { get; set; }    // Ví dụ: 氵, 人, 女

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }         // Ví dụ: Bộ Thủy, Bộ Nhân, Bộ Nữ

        public string? Meaning { get; set; }      // Ví dụ: Nước, Người, Phụ nữ

        public int StrokeCount { get; set; }     // Số nét của riêng bộ thủ đó

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property: Một bộ thủ có thể có nhiều chữ Kanji thuộc về nó
        public virtual ICollection<Kanjis> Kanjis { get; set; } = new List<Kanjis>();
        // Navigation property: Các biến thể của bộ thủ
        public virtual ICollection<RadicalVariants> RadicalVariants { get; set; } = new List<RadicalVariants>();
    }
}