using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Lessons_Topic
        {
            // Con thứ nhất: Trỏ về Lesson
            public Guid LessonsID { get; set; }
            [ForeignKey("LessonsID")]
            public virtual Lessons Lesson { get; set; } // Kiểu "1"

            // Con thứ hai: Trỏ về Topic
            public Guid TopicID { get; set; }
            [ForeignKey("TopicID")]
            public virtual Topics Topic { get; set; } // Kiểu "1"
        }
}