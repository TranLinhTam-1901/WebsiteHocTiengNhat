using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class RadicalVariants
    {
        [Key]
        public Guid VariantID { get; set; }

        [Required]
        [MaxLength(10)]
        public string Character { get; set; }   // Ví dụ: 氵, 忄, 扌

        [MaxLength(100)]
        public string? Name { get; set; }       // Ví dụ: Thủy (biến thể)

        public string? Meaning { get; set; }    // Ví dụ: Nước

        public int StrokeCount { get; set; }    // Số nét của biến thể

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        [Required]
        public Guid RadicalID { get; set; }

        // Navigation property
        [ForeignKey("RadicalID")]
        public virtual Radicals Radical { get; set; }
    }
}