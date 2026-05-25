using System.ComponentModel.DataAnnotations.Schema;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using System.ComponentModel.DataAnnotations;
public class Exams {
    [Key]
    public Guid ExamID { get; set; }
    public Guid? TemplateID { get; set; } // Trỏ đến khung đề JLPT

    [ForeignKey("TemplateID")]
    public virtual ExamTemplate? Template { get; set; }
    public Guid? CourseID { get; set; }
    [ForeignKey("CourseID")]
    public virtual Courses? Course { get; set; }

    public Guid? LessonID { get; set; }   // Trỏ đến bài học cụ thể
    [ForeignKey("LessonID")]
    public virtual Lessons? Lesson { get; set; }
    public Guid? LevelID { get; set; }
    [ForeignKey("LevelID")]
    public virtual JLPT_Level? Level { get; set; }
    
    public SkillType? TargetSkill { get; set; }

    [Column("Priority")] 
    public int SortOrder { get; set; } = 0;
    
    public bool IsCheckpoint { get; set; } = false;
    
    public ExamType Type { get; set; }
    public string Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // --- CẤU HÌNH ĐIỂM ---
    public decimal TotalMaxScore { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PassingScore { get; set; } // Điểm đỗ tổng

    // Điểm liệt cho từng phần (Nếu là bài thi thử JLPT thì dùng, bài luyện tập có thể để 0)
    public double MinLanguageKnowledgeScore { get; set; } // Từ vựng + Ngữ pháp
    public double MinReadingScore { get; set; }
    public double MinListeningScore { get; set; }
    
    // Cấu hình hiển thị kết quả
    public bool ShowResultImmediately { get; set; } = true;

    public int Duration { get; set; } // Thời gian làm bài (Phút)
    
    // Thuộc tính để Admin xác nhận đề đã sẵn sàng cho User làm chưa
    public bool IsPublished { get; set; }
    public int Version { get; set; } = 1; // Phiên bản đề thi, tăng khi có chỉnh sửa quan trọng

    public int TemplateVersion { get; set; }

    public virtual ICollection<Exam_Questions> ExamQuestions { get; set; }
    public virtual ICollection<Exam_Results> ExamResults { get; set; } = new List<Exam_Results>();
    public virtual ICollection<Exam_Result_Details> ExamResultDetails { get; set; } = new List<Exam_Result_Details>();
}