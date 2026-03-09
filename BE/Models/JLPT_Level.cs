using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.Models
{
    public class JLPT_Level
    {
        [Key]
        public Guid LevelID { get; set; }
        [Required]
        public string LevelName { get; set; }

        //Các mối quan hệ 
        public virtual ICollection<ApplicationUser> Users { get; set; }
        public virtual ICollection<Lessons> Lessons { get; set; }
        public virtual ICollection<Questions> Questions { get; set; }
        public virtual ICollection<Vocabularies> Vocabularies { get; set; }
        public virtual ICollection<Kanjis> Kanjis { get; set; }
        public virtual ICollection<Grammars> Grammars { get; set; }
    }
}
