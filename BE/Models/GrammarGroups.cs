using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.Models
{
    public class GrammarGroups
    {
        [Key]
        public Guid GrammarGroupID { get; set; }

        [Required]
        public string GroupName { get; set; } // Ví dụ: "Nhóm câu điều kiện", "Nhóm dự đoán"

        public string? Description { get; set; }

        public virtual ICollection<Grammars> Grammars { get; set; } = new List<Grammars>();
    }
}
