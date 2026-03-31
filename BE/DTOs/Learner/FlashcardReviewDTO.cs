using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Learner
{
    public class FlashcardReviewDTO
    {
        public Guid ItemID { get; set; }
        public SkillType ItemType { get; set; }
        public DateTime NextReview { get; set; }
        public FlashcardContentDTO Entity { get; set; }
    }

    public class FlashcardContentDTO
    {
        public string Kanji { get; set; }
        public string Furigana { get; set; }
        public string Meaning { get; set; }
        public string Example { get; set; }
    }
}
