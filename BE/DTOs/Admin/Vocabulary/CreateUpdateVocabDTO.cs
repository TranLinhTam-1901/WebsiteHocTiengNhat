using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Vocabulary
{
    public class CreateUpdateVocabDTO
    {
        [Required(ErrorMessage = "Từ vựng không được để trống")]
        public string Word { get; set; }

        [Required(ErrorMessage = "Cách đọc không được để trống")]
        public string Reading { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập ý nghĩa")]
        public string Meaning { get; set; }

        // --- SỬA CHỖ NÀY: Nhận danh sách ID loại từ từ Checkbox/Select ---
        [MinLength(1, ErrorMessage = "Vui lòng chọn ít nhất một loại từ")]
        public List<Guid> WordTypeIDs { get; set; } = new List<Guid>();
        // -------------------------------------------------------------

        public bool IsCommon { get; set; }
        public string? Mnemonics { get; set; }
        public string? ImageURL { get; set; }
        public string? AudioURL { get; set; }
        public int Priority { get; set; }
        public int Status { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn trình độ")]
        public Guid LevelID { get; set; }

        [MinLength(1, ErrorMessage = "Vui lòng chọn ít nhất một chủ đề")]
        public List<Guid> TopicIDs { get; set; } = new List<Guid>();

        [Required(ErrorMessage = "Vui lòng chọn bài học")]
        public Guid LessonID { get; set; }

        public List<VocabExampleDTO> Examples { get; set; } = new List<VocabExampleDTO>();
        public List<Guid> RelatedKanjiIDs { get; set; } = new List<Guid>();
    }

    public class VocabExampleDTO
    {
        public string Content { get; set; }
        public string Translation { get; set; }
    }
}