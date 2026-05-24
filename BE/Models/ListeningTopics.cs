using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class ListeningTopics
    {
        public Guid ListeningID { get; set; }
        [ForeignKey("ListeningID")]
        public virtual Listenings Listening { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}
