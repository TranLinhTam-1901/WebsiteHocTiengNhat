using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin
{
    public class CreateUpdateVocabDTO
    {
        [Required(ErrorMessage = "Từ vựng không được để trống")]
        public string Word { get; set; }
        [Required(ErrorMessage = "Cách đọc không được để trống")]
        public string Reading { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập ý nghĩa")]
        public string Meaning { get; set; }

        public string WordType { get; set; }
        public bool IsCommon { get; set; }
        public string? Mnemonics { get; set; }
        public string? ImageURL { get; set; } // Base64 hình ảnh
        public string? AudioURL { get; set; } // Base64 âm thanh
        public int Priority { get; set; }
        public int Status { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn trình độ")]
        public Guid LevelID { get; set; }
        [Required(ErrorMessage = "Vui lòng chọn chủ đề")]
        public Guid TopicID { get; set; }
        [Required(ErrorMessage = "Vui lòng chọn bài học")]
        public Guid LessonID { get; set; }

        // Danh sách ví dụ đi kèm
        public List<VocabExampleDTO> Examples { get; set; } = new List<VocabExampleDTO>();

        // Danh sách GUID của các Kanji liên quan (để tạo liên kết)
        public List<Guid> RelatedKanjiIDs { get; set; } = new List<Guid>();
    }

    public class VocabExampleDTO
    {
        public string Content { get; set; }
        public string Translation { get; set; }
    }
}