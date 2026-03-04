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
        public DbSet<Topics> Topics { get; set; } 
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

            // --- 1. Cấu hình bảng trung gian ---
            modelBuilder.Entity<Lessons_Topic>()
                .HasKey(lt => new { lt.LessonsID, lt.TopicID });

            modelBuilder.Entity<Questions_Topic>()
                .HasKey(qt => new { qt.QuestionID, qt.TopicID });

            // --- 2. Cấu hình Quan hệ cho các bảng Nội dung (Dùng Generic để tránh lỗi No Key) ---

            // Hàm bổ trợ để cấu hình chung
            void ConfigureContentEntity<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity) where T : class
            {
                // Lưu ý: Các thuộc tính LevelID, LessonID phải tồn tại trong Class T
                entity.HasOne("JLPTLevel").WithMany().HasForeignKey("LevelID").OnDelete(DeleteBehavior.Restrict);
                entity.HasOne("Lesson").WithMany().HasForeignKey("LessonID").OnDelete(DeleteBehavior.Restrict);
            }

            modelBuilder.Entity<Vocabularies>(e => {
                ConfigureContentEntity(e);
                e.HasOne(x => x.Topic).WithMany(t => t.Vocabularies).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Grammars>(e => {
                ConfigureContentEntity(e);
                e.HasOne(x => x.Topic).WithMany(t => t.Grammars).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Readings>(e => {
                ConfigureContentEntity(e);
                e.HasOne(x => x.Topic).WithMany(t => t.Readings).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Listenings>(e => {
                ConfigureContentEntity(e);
                e.HasOne(x => x.Topic).WithMany(t => t.Listenings).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Kanjis>(e => {
                // Kanji thường không có TopicID trong Model của bạn nên gọi riêng
                e.HasOne(x => x.JLPTLevel).WithMany(l => l.Kanjis).HasForeignKey(x => x.LevelID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.Restrict);
            });

            // --- 3. Giữ nguyên các cấu hình Enum và Tự tham chiếu ---
            modelBuilder.Entity<Questions>(entity => {
                entity.HasOne(q => q.ParentQuestion)
                      .WithMany(q => q.SubQuestions)
                      .HasForeignKey(q => q.ParentID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(q => q.QuestionType).HasConversion<string>();
                entity.Property(q => q.Status).HasConversion<string>();
            });

            modelBuilder.Entity<Answers>()
                .HasOne(a => a.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QuestionID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Lessons>().Property(l => l.SkillType).HasConversion<string>();
        }
    }
}
