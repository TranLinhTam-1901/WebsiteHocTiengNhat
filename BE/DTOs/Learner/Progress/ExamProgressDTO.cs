namespace QuizzTiengNhat.DTOs.Learner.Progress
{
    public class ExamProgressDTO
    {
        public int TotalExams { get; set; }
        public int PassedExams { get; set; }
        public double PassRate { get; set; } // Phần trăm đã vượt qua (0-100)
        public double AverageScore { get; set; } // Điểm trung bình (0-100)
    }
}
