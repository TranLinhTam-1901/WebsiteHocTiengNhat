using Microsoft.AspNetCore.Identity;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        public string FullName { get; set; } = default!;

        [ForeignKey("Level")]
        public Guid? LevelID { get; set; }
        public virtual JLPT_Level? Level { get; set; }

        public string? AvatarUrl { get; set; }

        // 3. Quan hệ 1-nhiều tới các bảng tiến trình và kết quả
        public virtual ICollection<Progress> Progresses { get; set; } = new List<Progress>();
        public virtual ICollection<Exam_Results> ExamResults { get; set; } = new List<Exam_Results>();
    }
}
