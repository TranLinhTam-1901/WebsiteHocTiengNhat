using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class ReadingTopics
    {
        public Guid ReadingID { get; set; }
        [ForeignKey("ReadingID")]
        public virtual Readings Reading { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}
