using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin
{
    public class GrammarGroupDTO
    {
        public Guid GrammarGroupID { get; set; }
        public string GroupName { get; set; }
        public string? Description { get; set; }
        public int GrammarCount { get; set; } // Số lượng cấu trúc trong nhóm này
    }

    public class CreateUpdateGrammarGroupDTO
    {
        [Required(ErrorMessage = "Tên nhóm không được để trống")]
        public string GroupName { get; set; }
        public string? Description { get; set; }
    }
}