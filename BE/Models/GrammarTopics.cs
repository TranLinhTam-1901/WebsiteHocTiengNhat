using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class GrammarTopics
    {
        public Guid GrammarID { get; set; }
        [ForeignKey("GrammarID")]
        public virtual Grammars Grammar { get; set; }

        public Guid TopicID { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}
