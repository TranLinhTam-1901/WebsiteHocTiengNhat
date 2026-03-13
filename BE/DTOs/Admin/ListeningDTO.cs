namespace QuizzTiengNhat.DTOs.Admin
{
    public class ListeningDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string AudioURL { get; set; }
        public string LevelName { get; set; }
        public string TopicName { get; set; }
        public int Duration { get; set; }
        public string? SpeedCategory { get; set; }
        public int Status { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}