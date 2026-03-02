using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Readings
{
    [Key]
    public Guid ReadingID { get; set; } = Guid.NewGuid();
    public string Title { get; set; }
    public string Content { get; set; }
    public string Translation { get; set; }

    public Guid LessonID { get; set; }
    public virtual Lessons Lesson { get; set; }
    public Guid TopicID { get; set; }
    public virtual Topic Topic { get; set; }
}
}