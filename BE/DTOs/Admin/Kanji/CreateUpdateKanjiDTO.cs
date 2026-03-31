using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Kanji
{
    public class CreateUpdateKanjiDTO
    {
        [Required(ErrorMessage = "Chữ Kanji không được để trống")]
        public string Character { get; set; }

        public string Onyomi { get; set; }
        public string Kunyomi { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập ý nghĩa Hán Việt")]
        public string Meaning { get; set; }

        public int StrokeCount { get; set; }
        public string? StrokeGif { get; set; }

        // --- SỬA CHỖ NÀY: Dùng ID để liên kết bảng ---
        [Required(ErrorMessage = "Vui lòng chọn bộ thủ")]
        public Guid RadicalID { get; set; }
        // -------------------------------------------

        public string? Mnemonics { get; set; }
        public int Popularity { get; set; }
        public string? Note { get; set; }

        // SỬA: Giá trị Status nên lấy theo Enum Status
        public int Status { get; set; } = 1;

        [Required(ErrorMessage = "Vui lòng chọn trình độ")]
        public Guid LevelID { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn chủ đề")]
        public Guid TopicID { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn bài học")]
        public Guid LessonID { get; set; }

        public List<Guid> RelatedVocabIDs { get; set; } = new List<Guid>();
    }
}