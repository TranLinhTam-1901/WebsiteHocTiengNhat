using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using QuizzTiengNhat.Models.Enums; 
namespace QuizzTiengNhat.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) :base(options)
        {

        }
        public DbSet<JLPT_Level> JLPT_Levels { get; set; }
        public DbSet<Lessons> Lessons { get; set; }
        public DbSet<Questions> Questions { get; set; }
        public DbSet<Progress> Progresses { get; set; }
        public DbSet<Exam_Results> Exam_Results { get; set; }
        public DbSet<Courses> Courses { get; set; } 
        public DbSet<Topic> Topics { get; set; } 
        public DbSet<Vocabularies> Vocabularies { get; set; }
        public DbSet<Grammars> Grammars { get; set; } 
        public DbSet<Kanjis> Kanjis { get; set; } 
        public DbSet<Listenings> Listenings { get; set; } 
        public DbSet<Readings> Readings { get; set; } 
        public DbSet<Answers> Answers { get; set; }

      // 2. Khai báo các bảng trung gian (Many-to-Many)
        public DbSet<Lessons_Topic> Lessons_Topics { get; set; }
        public DbSet<Questions_Topic> Questions_Topics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình Khóa chính kép (Composite Key) cho bảng trung gian Lessons_Topic
            modelBuilder.Entity<Lessons_Topic>()
                .HasKey(lt => new { lt.LessonsID, lt.TopicID });

            // Cấu hình Khóa chính kép cho bảng trung gian Questions_Topic
            modelBuilder.Entity<Questions_Topic>()
                .HasKey(qt => new { qt.QuestionID, qt.TopicID });

            // Cấu hình tự tham chiếu cho bảng Questions (ParentID)
            modelBuilder.Entity<Questions>()
                .HasOne(q => q.ParentQuestion)
                .WithMany(q => q.SubQuestions)
                .HasForeignKey(q => q.ParentID)
                .OnDelete(DeleteBehavior.Restrict); // Tránh xóa dây chuyền gây lỗi

            modelBuilder.Entity<Answers>()
            .HasOne(a => a.Question)
            .WithMany(q => q.Answers)
            .HasForeignKey(a => a.QuestionID)
            .OnDelete(DeleteBehavior.Cascade);

            // Lưu SkillType của Lesson dưới dạng string
            modelBuilder.Entity<Lessons>()
                .Property(l => l.SkillType)
                .HasConversion<string>();

            // Lưu QuestionType dưới dạng string
            modelBuilder.Entity<Questions>()
                .Property(q => q.QuestionType)
                .HasConversion<string>();

            // Lưu Status dưới dạng string
            modelBuilder.Entity<Questions>()
                .Property(q => q.Status)
                .HasConversion<string>();

        }
    }
}
