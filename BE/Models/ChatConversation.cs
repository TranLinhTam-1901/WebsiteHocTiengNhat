using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class ChatConversation
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string LearnerId { get; set; } = null!;

        [ForeignKey(nameof(LearnerId))]
        public virtual ApplicationUser Learner { get; set; } = null!;

        /// <summary>Admin được chọn bởi Round Robin khi hội thoại được tạo.</summary>
        [Required]
        public string AssignedAdminId { get; set; } = null!;

        [ForeignKey(nameof(AssignedAdminId))]
        public virtual ApplicationUser AssignedAdmin { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
