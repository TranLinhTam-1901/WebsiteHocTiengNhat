using System.ComponentModel.DataAnnotations;
namespace QuizzTiengNhat.Models
{
    public class Topics
    {
        [Key]
        public Guid TopicID { get; set; } = Guid.NewGuid();
        [Required]
        public string TopicName { get; set; }
        public string Description { get; set; }

        // Navigation properties chĩa đến các bảng nội dung thô
        public virtual ICollection<Vocabularies> Vocabularies { get; set; } = new List<Vocabularies>();
        public virtual ICollection<Grammars> Grammars { get; set; } = new List<Grammars>();
        public virtual ICollection<Listenings> Listenings { get; set; } = new List<Listenings>();
        public virtual ICollection<Readings> Readings { get; set; } = new List<Readings>();

        // Navigation properties cho bảng liên kết
        public virtual ICollection<Questions_Topic> QuestionTopics { get; set; } = new List<Questions_Topic>();
        public virtual ICollection<Lessons_Topic> LessonTopics { get; set; } = new List<Lessons_Topic>(); // Kiểu "n"
    }
}