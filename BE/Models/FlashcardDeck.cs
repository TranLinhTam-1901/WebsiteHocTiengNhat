using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class FlashcardDeck
    {
        [Key]
        public Guid DeckID { get; set; }

        [Required]
        public string Name { get; set; }
        public string? Description { get; set; }

        public SkillType SkillType { get; set; }

        public Guid? LevelID { get; set; }
        [ForeignKey("LevelID")]
        public virtual JLPT_Level? Level { get; set; }

        public string UserID { get; set; }
        [ForeignKey("UserID")]
        public virtual ApplicationUser User { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Danh sách các mục (Vocab/Kanji) trong bộ thẻ này
        public virtual ICollection<FlashcardItem> Items { get; set; } = new List<FlashcardItem>();
    }
}
