namespace QuizzTiengNhat.DTOs.Admin
{
    public class ReadingDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string LevelName { get; set; }
        public string TopicName { get; set; }
        public int WordCount { get; set; }
        public int EstimatedTime { get; set; }
        public int Status { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}