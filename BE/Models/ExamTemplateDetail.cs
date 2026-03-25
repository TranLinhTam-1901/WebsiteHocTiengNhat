using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public class ExamTemplateDetail {
    
    [Key]
    public Guid DetailID { get; set; }
    
    public SkillType SkillType { get; set; }
    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PointPerQuestion { get; set; }
    public Guid TemplateID { get; set; }
    // Bổ sung dòng này để hết lỗi CS1061
    [ForeignKey("TemplateID")]
    public virtual ExamTemplate Template { get; set; }
}