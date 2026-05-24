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

        /// <summary>Bộ thẻ do học viên tự tạo; LevelID được giữ đồng bộ với trình độ tài khoản.</summary>
        public bool IsUserCustomDeck { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Khóa cố định để đồng bộ deck theo cấp/chủ đề (deck tự động theo level), tránh tạo trùng.</summary>
        public string? DeckSyncKey { get; set; }

        /// <summary>Phiên học dở: chế độ learn | continue | review | due</summary>
        public string? ActiveStudyMode { get; set; }

        /// <summary>JSON mảng Guid ItemID theo thứ tự hiển thị</summary>
        public string? ActiveStudyQueueJson { get; set; }

        public int ActiveStudyCursor { get; set; }

        public DateTime? ActiveStudyUpdatedAt { get; set; }

        // Danh sách các mục (Vocab/Kanji) trong bộ thẻ này
        public virtual ICollection<FlashcardItem> Items { get; set; } = new List<FlashcardItem>();
    }
}
