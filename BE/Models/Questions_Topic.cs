using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace QuizzTiengNhat.Models
{
    public class Questions_Topic
    {
        public Guid QuestionID { get; set; }
        [ForeignKey("QuestionID")]
        public virtual Questions Question { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}