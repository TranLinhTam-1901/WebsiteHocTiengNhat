using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Models
{
    public class User_Skill_Matrix
    {
        [Key]
        public Guid MatrixID { get; set; }

        public string UserID { get; set; }
        [ForeignKey("UserID")]
        public virtual ApplicationUser User { get; set; }

        public SkillType SkillType { get; set; }
        public int ProficiencyScore { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        public Guid? LevelID { get; set; }
        [ForeignKey("LevelID")]
        public virtual JLPT_Level Level { get; set; }

        public bool NeedsReview { get; set; } = false;
        public int Confidence { get; set; } = 0;
    }
}
