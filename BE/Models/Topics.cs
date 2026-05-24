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
        public virtual ICollection<VocabTopics> VocabTopics { get; set; } = new List<VocabTopics>();
        public virtual ICollection<GrammarTopics> GrammarTopics { get; set; } = new List<GrammarTopics>();
        public virtual ICollection<ReadingTopics> ReadingTopics { get; set; } = new List<ReadingTopics>();
        public virtual ICollection<ListeningTopics> ListeningTopics { get; set; } = new List<ListeningTopics>();

        // Navigation properties cho bảng liên kết
        public virtual ICollection<Questions_Topic> QuestionTopics { get; set; } = new List<Questions_Topic>();
        public virtual ICollection<Lessons_Topic> LessonTopics { get; set; } = new List<Lessons_Topic>(); // Kiểu "n"
    }
}