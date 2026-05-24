using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class VocabTopics
    {
        public Guid VocabID { get; set; }
        [ForeignKey("VocabID")]
        public virtual Vocabularies Vocabulary { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}
