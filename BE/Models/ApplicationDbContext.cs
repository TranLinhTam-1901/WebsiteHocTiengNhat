using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // --- Danh mục nội dung ---
        public DbSet<JLPT_Level> JLPT_Levels { get; set; }
        public DbSet<Courses> Courses { get; set; }
        public DbSet<Topics> Topics { get; set; }
        public DbSet<Lessons> Lessons { get; set; }

        // --- Nội dung học tập ---
        public DbSet<Vocabularies> Vocabularies { get; set; }
        public DbSet<Grammars> Grammars { get; set; }
        public DbSet<Kanjis> Kanjis { get; set; }
        public DbSet<Listenings> Listenings { get; set; }
        public DbSet<Readings> Readings { get; set; }
        public DbSet<Examples> Examples { get; set; } // Bổ sung mới

        // --- Câu hỏi & Đáp án ---
        public DbSet<Questions> Questions { get; set; }
        public DbSet<Answers> Answers { get; set; }

        // --- Người dùng & Kết quả ---
        public DbSet<Progress> Progresses { get; set; }
        public DbSet<Exam_Results> Exam_Results { get; set; }

        // --- Bảng trung gian (Many-to-Many) ---
        public DbSet<Lessons_Topic> Lessons_Topics { get; set; }
        public DbSet<Questions_Topic> Questions_Topics { get; set; }
        public DbSet<VocabularyKanjis> VocabularyKanjis { get; set; } // Bổ sung mới

        // --- Quản lý Bài kiểm tra & Bài luyện tập (MỚI) ---
        public DbSet<ExamTemplate> ExamTemplates { get; set; }
        public DbSet<ExamTemplateDetail> ExamTemplateDetails { get; set; }
        public DbSet<Exams> Exams { get; set; }
        public DbSet<Exam_Questions> Exam_Questions { get; set; }
       

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- 1. Cấu hình Khóa chính cho bảng trung gian ---
            modelBuilder.Entity<Lessons_Topic>().HasKey(lt => new { lt.LessonsID, lt.TopicID });
            modelBuilder.Entity<Questions_Topic>().HasKey(qt => new { qt.QuestionID, qt.TopicID });
            modelBuilder.Entity<VocabularyKanjis>().HasKey(vk => new { vk.VocabID, vk.KanjiID });

            // Cấu hình Exams (Phân loại bài làm)
            modelBuilder.Entity<Exams>(e => {
                e.Property(x => x.Type);
                e.Property(x => x.TargetSkill);

                // Quan hệ với Template (SetNull để giữ lại bài làm khi xóa mẫu đề)
                e.HasOne(x => x.Template)
                 .WithMany()
                 .HasForeignKey(x => x.TemplateID)
                 .OnDelete(DeleteBehavior.SetNull);

                // Quan hệ với Lesson
                e.HasOne(x => x.Lesson)
                 .WithMany()
                 .HasForeignKey(x => x.LessonID)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // Cấu hình ExamTemplate & Detail
            modelBuilder.Entity<ExamTemplateDetail>(ed => {
                ed.Property(x => x.SkillType);
                
                ed.HasOne(x => x.Template)
                  .WithMany(t => t.Details)
                  .HasForeignKey(x => x.TemplateID)
                  .OnDelete(DeleteBehavior.Cascade);
            });

            // Cấu hình Exam_Questions (Bảng liên kết câu hỏi cho đề thi)
            modelBuilder.Entity<Exam_Questions>(eq => {
                eq.HasOne(x => x.Exam)
                  .WithMany(e => e.ExamQuestions)
                  .HasForeignKey(x => x.ExamID)
                  .OnDelete(DeleteBehavior.Cascade);

                eq.HasOne(x => x.Question)
                  .WithMany()
                  .HasForeignKey(x => x.QuestionID)
                  .OnDelete(DeleteBehavior.Restrict); // Không xóa câu hỏi gốc khi xóa bài thi
            });

            // Cấu hình Exam_Results
            modelBuilder.Entity<Exam_Results>(er => {
                er.HasOne(x => x.Exam)
                  .WithMany()
                  .HasForeignKey(x => x.ExamID)
                  .OnDelete(DeleteBehavior.Cascade);
            });


            // Cấu hình thực thể Examples (Dùng chung cho Vocab & Grammar) ---
            modelBuilder.Entity<Examples>(e => {
                e.HasOne(x => x.Vocabulary)
                 .WithMany(v => v.Examples)
                 .HasForeignKey(x => x.VocabID)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Grammar)
                 .WithMany(g => g.Examples)
                 .HasForeignKey(x => x.GrammarID)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Cấu hình Vocabularies & Kanjis (Many-to-Many qua VocabularyKanjis) ---
            modelBuilder.Entity<VocabularyKanjis>()
                .HasOne(vk => vk.Vocabulary)
                .WithMany(v => v.RelatedKanjis)
                .HasForeignKey(vk => vk.VocabID);

            modelBuilder.Entity<VocabularyKanjis>()
                .HasOne(vk => vk.Kanji)
                .WithMany(k => k.RelatedVocabularies)
                .HasForeignKey(vk => vk.KanjiID);

            // Cấu hình Quan hệ cho nội dung (Restrict để tránh lỗi xóa vòng) ---

            // Vocabularies
            modelBuilder.Entity<Vocabularies>(e => {
                e.HasOne(x => x.JLPTLevel).WithMany().HasForeignKey(x => x.LevelID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Topic).WithMany(t => t.Vocabularies).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
                e.Property(x => x.Status).HasDefaultValue(1);
            });

            // Grammars
            modelBuilder.Entity<Grammars>(e => {
                e.HasOne(x => x.JLPTLevel).WithMany().HasForeignKey(x => x.LevelID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Topic).WithMany(t => t.Grammars).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
                e.Property(x => x.Status).HasDefaultValue(1);
            });

            // Kanjis
            modelBuilder.Entity<Kanjis>(e => {
                e.HasOne(x => x.JLPTLevel).WithMany(l => l.Kanjis).HasForeignKey(x => x.LevelID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.Restrict);
                e.Property(x => x.Status).HasDefaultValue(1);
            });

            // Readings
            modelBuilder.Entity<Readings>(e => {
                e.HasOne(x => x.JLPTLevel).WithMany().HasForeignKey(x => x.LevelID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Topic).WithMany(t => t.Readings).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
                e.HasMany(r => r.Questions).WithOne(q => q.Reading).HasForeignKey(q => q.ReadingID).OnDelete(DeleteBehavior.Cascade);
            });

            // Listenings
            modelBuilder.Entity<Listenings>(e => {
                e.HasOne(x => x.JLPTLevel).WithMany().HasForeignKey(x => x.LevelID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Topic).WithMany(t => t.Listenings).HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
                e.HasMany(l => l.Questions).WithOne(q => q.Listening).HasForeignKey(q => q.ListeningID).OnDelete(DeleteBehavior.Cascade);
            });

            // Cấu hình Questions & Answers ---
            modelBuilder.Entity<Questions>(e => {
                // Tự tham chiếu (Cha-Con)
                e.HasOne(q => q.ParentQuestion)
                 .WithMany(q => q.SubQuestions)
                 .HasForeignKey(q => q.ParentID)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(q => q.Lesson)
                 .WithMany()
                 .HasForeignKey(q => q.LessonID)
                 .OnDelete(DeleteBehavior.Restrict);

                e.Property(q => q.Status);
            });

            modelBuilder.Entity<Answers>(e => {
                e.HasOne(a => a.Question)
                 .WithMany(q => q.Answers)
                 .HasForeignKey(a => a.QuestionID)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Cấu hình khác ---
            modelBuilder.Entity<Lessons>().Property(l => l.SkillType).HasConversion<string>();
        }
    }
}