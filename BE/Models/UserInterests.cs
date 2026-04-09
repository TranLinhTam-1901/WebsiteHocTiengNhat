using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class UserInterest
    {
        public string UserID { get; set; }
        public Guid TopicID { get; set; }
        public int InteractionCount { get; set; } // Tự tăng khi user nhấn vào topic này

        [ForeignKey("UserID")]
        public virtual ApplicationUser User { get; set; }
        [ForeignKey("TopicID")]
        public virtual Topics Topic { get; set; }
    }
}
