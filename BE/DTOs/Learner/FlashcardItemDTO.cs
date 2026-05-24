using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Learner
{
    public class FlashcardItemDTO
    {
        public Guid ItemID { get; set; }
        public Guid EntityID { get; set; }
        public SkillType ItemType { get; set; }

        // Thông tin hiển thị (Entity)
        public string Kanji { get; set; }
        public string Furigana { get; set; }
        public string Meaning { get; set; }
        public string Example { get; set; }

        // Thông tin SRS
        public double EF { get; set; }
        public int Interval { get; set; }
        public DateTime NextReview { get; set; }
        public bool IsMastered { get; set; }
    }
}
