using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class ChatMessage
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ConversationId { get; set; }

        [ForeignKey(nameof(ConversationId))]
        public virtual ChatConversation Conversation { get; set; } = null!;

        [Required]
        public string SenderId { get; set; } = null!;

        [ForeignKey(nameof(SenderId))]
        public virtual ApplicationUser Sender { get; set; } = null!;

        [Required]
        [MaxLength(8000)]
        public string Content { get; set; } = null!;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
