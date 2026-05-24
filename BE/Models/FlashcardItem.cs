using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class FlashcardItem
    {
        [Key]
        public Guid ItemID { get; set; }

        public Guid DeckID { get; set; }
        [ForeignKey("DeckID")]
        public virtual FlashcardDeck Deck { get; set; }

        // Đa hình: Trỏ đến VocabID, KanjiID hoặc GrammarID
        public Guid EntityID { get; set; }
        public SkillType ItemType { get; set; }

        // --- CÁC THAM SỐ THUẬT TOÁN SRS (QUAN TRỌNG) ---

        // Mức độ dễ (Ease Factor): Mặc định là 2.5. 
        // Nếu User trả lời đúng liên tục, chỉ số này tăng lên (khoảng cách ôn tập xa hơn).
        public double EF { get; set; } = 2.5;

        // Khoảng cách ôn tập (Interval): Tính bằng ngày.
        public int Interval { get; set; } = 0;

        // Số lần trả lời đúng liên tiếp
        public int Repetitions { get; set; } = 0;

        // Ngày ôn tập tiếp theo (AI sẽ dựa vào đây để lấy thẻ ra cho User)
        public DateTime NextReview { get; set; } = DateTime.UtcNow;

        public DateTime LastReviewed { get; set; }

        /// <summary>Chất lượng lần ôn SRS gần nhất (0–5), map với SM-2 / nút Đã thuộc–Chưa thuộc</summary>
        public int? LastReviewQuality { get; set; }

        /// <summary>Thời gian trả lời (giây) lần ôn gần nhất trên flashcard</summary>
        public int? LastTimeTakenSeconds { get; set; }

        public bool IsMastered { get; set; } = false; // Đánh dấu nếu đã thuộc hoàn toàn
    }
}
