using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // --- 1. Danh mục hệ thống ---
        public DbSet<JLPT_Level> JLPT_Levels { get; set; }
        public DbSet<Courses> Courses { get; set; }
        public DbSet<Topics> Topics { get; set; }
        public DbSet<Lessons> Lessons { get; set; }
        public DbSet<Radicals> Radicals { get; set; }
        public DbSet<RadicalVariants> RadicalVariants { get; set; }
        public DbSet<WordTypes> WordTypes { get; set; }
        public DbSet<GrammarGroups> GrammarGroups { get; set; }

        // --- 2. Nội dung học tập chính ---
        public DbSet<Vocabularies> Vocabularies { get; set; }
        public DbSet<Grammars> Grammars { get; set; }
        public DbSet<Kanjis> Kanjis { get; set; }
        public DbSet<Listenings> Listenings { get; set; }
        public DbSet<Readings> Readings { get; set; }
        public DbSet<Examples> Examples { get; set; }

        // --- 3. Câu hỏi & Đáp án ---
        public DbSet<Questions> Questions { get; set; }
        public DbSet<Answers> Answers { get; set; }

        // --- 4. Người dùng & Kết quả ---
        public DbSet<Progress> Progresses { get; set; }
        public DbSet<Exam_Results> Exam_Results { get; set; }

        // --- 5. Bảng trung gian (Many-to-Many) ---
        public DbSet<Lessons_Topic> Lessons_Topics { get; set; }
        public DbSet<Questions_Topic> Questions_Topics { get; set; }
        public DbSet<VocabularyKanjis> VocabularyKanjis { get; set; }
        public DbSet<VocabWordTypes> VocabWordTypes { get; set; }
        public DbSet<VocabTopics> VocabTopics { get; set; }

        // MỚI: Thêm các bảng trung gian cho Ngữ pháp, Đọc, Nghe
        public DbSet<GrammarTopics> GrammarTopics { get; set; }
        public DbSet<ReadingTopics> ReadingTopics { get; set; }
        public DbSet<ListeningTopics> ListeningTopics { get; set; }

        // --- Quản lý Bài kiểm tra & Bài luyện tập (MỚI) ---
        public DbSet<ExamTemplate> ExamTemplates { get; set; }
        public DbSet<ExamTemplateDetail> ExamTemplateDetails { get; set; }
        public DbSet<Exams> Exams { get; set; }
        public DbSet<Exam_Questions> Exam_Questions { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- A. COMPOSITE KEYS (BẢNG TRUNG GIAN) ---
            modelBuilder.Entity<Lessons_Topic>().HasKey(lt => new { lt.LessonsID, lt.TopicID });
            modelBuilder.Entity<Questions_Topic>().HasKey(qt => new { qt.QuestionID, qt.TopicID });
            modelBuilder.Entity<VocabularyKanjis>().HasKey(vk => new { vk.VocabID, vk.KanjiID });
            modelBuilder.Entity<VocabWordTypes>().HasKey(vw => new { vw.VocabID, vw.WordTypeID });
            modelBuilder.Entity<VocabTopics>().HasKey(vt => new { vt.VocabID, vt.TopicID });
            modelBuilder.Entity<GrammarTopics>().HasKey(gt => new { gt.GrammarID, gt.TopicID });
            modelBuilder.Entity<ReadingTopics>().HasKey(rt => new { rt.ReadingID, rt.TopicID });
            modelBuilder.Entity<ListeningTopics>().HasKey(lt => new { lt.ListeningID, lt.TopicID });

            // --- B. EXAMS & TEMPLATES (MỚI) ---
            modelBuilder.Entity<Exams>(e => {
                e.Property(x => x.Type).HasConversion<int>();
                e.Property(x => x.TargetSkill).HasConversion<int>();
                e.HasOne(x => x.Template).WithMany().HasForeignKey(x => x.TemplateID).OnDelete(DeleteBehavior.SetNull);
                e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonID).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ExamTemplateDetail>(ed => {
                ed.Property(x => x.SkillType).HasConversion<int>();
                ed.HasOne(x => x.Template).WithMany(t => t.Details).HasForeignKey(x => x.TemplateID).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Exam_Questions>(eq => {
                eq.HasOne(x => x.Exam).WithMany(e => e.ExamQuestions).HasForeignKey(x => x.ExamID).OnDelete(DeleteBehavior.Cascade);
                eq.HasOne(x => x.Question).WithMany().HasForeignKey(x => x.QuestionID).OnDelete(DeleteBehavior.Restrict);
            });

            // --- C. NỘI DUNG HỌC TẬP (VOCAB, GRAMMAR, KANJI) ---
            modelBuilder.Entity<Examples>(e => {
                e.HasOne(x => x.Vocabulary).WithMany(v => v.Examples).HasForeignKey(x => x.VocabID).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Grammar).WithMany(g => g.Examples).HasForeignKey(x => x.GrammarID).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Kanjis>(e => {
                e.HasOne(x => x.Radical).WithMany(r => r.Kanjis).HasForeignKey(x => x.RadicalID).OnDelete(DeleteBehavior.SetNull);
                e.Property(x => x.Status).HasConversion<int>().HasDefaultValue(Status.Published);
            });

            modelBuilder.Entity<Grammars>(e => {
                e.HasOne(x => x.GrammarGroup).WithMany(gg => gg.Grammars).HasForeignKey(x => x.GrammarGroupID).OnDelete(DeleteBehavior.SetNull);
                e.Property(x => x.Formality).HasConversion<int>();
                e.Property(x => x.Status).HasConversion<int>().HasDefaultValue(Status.Published);
            });

            // --- D. QUESTIONS & ANSWERS ---
            modelBuilder.Entity<Questions>(e => {
                e.HasOne(q => q.ParentQuestion).WithMany(q => q.SubQuestions).HasForeignKey(q => q.ParentID).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(q => q.Lesson).WithMany().HasForeignKey(q => q.LessonID).OnDelete(DeleteBehavior.Restrict);
                e.Property(q => q.QuestionType).HasConversion<int>();
                e.Property(q => q.SkillType).HasConversion<int>(); // Bổ sung cho lỗi NOT NULL SkillType bạn gặp lúc nãy
                e.Property(q => q.Status).HasConversion<int>().HasDefaultValue(Status.Published);
            });

            // --- E. ĐĂNG KÝ ENUMS CHO CÁC BẢNG KHÁC ---
            modelBuilder.Entity<Lessons>().Property(l => l.SkillType).HasConversion<string>();

            // --- F. GLOBAL RESTRICTIONS (CHỐNG XÓA VÒNG) ---
            foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                if (!relationship.IsOwnership && relationship.DeleteBehavior == DeleteBehavior.Cascade &&
                    (relationship.DeclaringEntityType.Name.Contains("Lessons") || relationship.DeclaringEntityType.Name.Contains("JLPT_Level")))
                {
                    relationship.DeleteBehavior = DeleteBehavior.Restrict;
                }
            }
        }
    }
}