using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Grammar
{
    public class CreateUpdateGrammarDTO
    {
        [Required(ErrorMessage = "Tiêu đề ngữ pháp không được để trống")]
        public string Title { get; set; }

        public string Structure { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập ý nghĩa")]
        public string Meaning { get; set; }

        public string Explanation { get; set; }

        // --- SỬA CÁC TRƯỜNG NÀY ---
        public GrammarCategory GrammarType { get; set; } // Ví dụ: "Trợ từ", "Liên từ"

        [Range(0, 5, ErrorMessage = "Sắc thái không hợp lệ")]
        public int Formality { get; set; } // 0: Neutral, 1: Casual, 2: Polite...

        public Guid? GrammarGroupID { get; set; } // Chọn từ danh sách nhóm có sẵn
        // -------------------------

        public string? UsageNote { get; set; }
        public int Status { get; set; } = 1;

        [Required(ErrorMessage = "Vui lòng chọn trình độ")]
        public Guid LevelID { get; set; }

        [MinLength(1, ErrorMessage = "Vui lòng chọn ít nhất một chủ đề")]
        public List<Guid> TopicIDs { get; set; } = new List<Guid>();

        [Required(ErrorMessage = "Vui lòng chọn bài học")]
        public Guid LessonID { get; set; }

        public List<GrammarExampleDTO> Examples { get; set; } = new List<GrammarExampleDTO>();
    }

    public class GrammarExampleDTO
    {
        public Guid? ExampleID { get; set; }

        [Required(ErrorMessage = "Nội dung ví dụ không được để trống")]
        public string Content { get; set; }

        [Required(ErrorMessage = "Bản dịch không được để trống")]
        public string Translation { get; set; }

        public string? AudioURL { get; set; }
    }
}