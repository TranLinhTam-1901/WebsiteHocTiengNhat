using QuizzTiengNhat.Models.Enums;
using  System.ComponentModel.DataAnnotations.Schema;
public class ExamPartConfigDTO
{
    public SkillType SkillType { get; set; }
    public int Quantity { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal PointPerQuestion { get; set; }
}