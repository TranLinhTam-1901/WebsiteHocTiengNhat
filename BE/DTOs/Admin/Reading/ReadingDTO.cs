namespace QuizzTiengNhat.DTOs.Admin.Reading
{
    public class ReadingDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string LevelName { get; set; }
        public List<TopicDTO> Topics { get; set; } = new List<TopicDTO>();
        public string LessonName { get; set; }
        public int WordCount { get; set; }
        public int EstimatedTime { get; set; }
        public int Status { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}