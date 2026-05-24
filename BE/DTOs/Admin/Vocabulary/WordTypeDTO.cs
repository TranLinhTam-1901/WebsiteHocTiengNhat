using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Vocabulary
{
    // Dùng để hiển thị danh sách loại từ
    public class WordTypeDTO
    {
        public Guid WordTypeID { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
    }

    // Dùng để Thêm mới/Cập nhật loại từ
    public class CreateUpdateWordTypeDTO
    {
        [Required(ErrorMessage = "Tên loại từ không được để trống")]
        public string Name { get; set; }
        public string? Description { get; set; }
    }
}