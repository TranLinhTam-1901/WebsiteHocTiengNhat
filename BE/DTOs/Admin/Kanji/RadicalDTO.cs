using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Kanji
{
    // Dùng để hiển thị danh sách bộ thủ
    public class RadicalDTO
    {
        public Guid RadicalID { get; set; }
        public string Character { get; set; }
        public string Name { get; set; }
        public string Meaning { get; set; }
        public int StrokeCount { get; set; }
    }

    // Dùng để Thêm mới/Cập nhật bộ thủ
    public class CreateUpdateRadicalDTO
    {
        [Required(ErrorMessage = "Mặt chữ bộ thủ không được để trống")]
        public string Character { get; set; }

        [Required(ErrorMessage = "Tên bộ thủ không được để trống")]
        public string Name { get; set; }

        public string Meaning { get; set; }
        public int StrokeCount { get; set; }
    }
}