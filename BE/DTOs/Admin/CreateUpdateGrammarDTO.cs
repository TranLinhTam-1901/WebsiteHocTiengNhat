using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin
{
    public class CreateUpdateGrammarDTO
    {
        [Required(ErrorMessage = "Tiêu đề ngữ pháp không được để trống")]
        public string Title { get; set; }

        public string Structure { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập ý nghĩa")]
        public string Meaning { get; set; }

        public string Explanation { get; set; }

        // --- Các trường UX mới bổ sung ---
        public string? Formality { get; set; }
        public string? SimilarGrammar { get; set; }
        public string? UsageNote { get; set; }
        public int Status { get; set; } = 1;

        [Required(ErrorMessage = "Vui lòng chọn trình độ")]
        public Guid LevelID { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn chủ đề")]
        public Guid TopicID { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn bài học")]
        public Guid LessonID { get; set; }

        // Danh sách ví dụ đi kèm
        public List<GrammarExampleDTO> Examples { get; set; } = new List<GrammarExampleDTO>();
    }

    public class GrammarExampleDTO
    {
        public Guid? ExampleID { get; set; }

        [Required]
        public string Content { get; set; } // Khớp với e.Content trong Model

        [Required]
        public string Translation { get; set; } // Khớp với e.Translation trong Model

        public string? AudioURL { get; set; }
    }
}