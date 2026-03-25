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

            // --- A. CẤU HÌNH KHÓA CHÍNH CHO BẢNG TRUNG GIAN (Composite Keys) ---
            modelBuilder.Entity<Lessons_Topic>().HasKey(lt => new { lt.LessonsID, lt.TopicID });
            modelBuilder.Entity<Questions_Topic>().HasKey(qt => new { qt.QuestionID, qt.TopicID });
            modelBuilder.Entity<VocabularyKanjis>().HasKey(vk => new { vk.VocabID, vk.KanjiID });
            modelBuilder.Entity<VocabWordTypes>().HasKey(vw => new { vw.VocabID, vw.WordTypeID });
            modelBuilder.Entity<VocabTopics>().HasKey(vt => new { vt.VocabID, vt.TopicID });

            // MỚI: Khai báo khóa chính cho các bảng trung gian mới
            modelBuilder.Entity<GrammarTopics>().HasKey(gt => new { gt.GrammarID, gt.TopicID });
            modelBuilder.Entity<ReadingTopics>().HasKey(rt => new { rt.ReadingID, rt.TopicID });
            modelBuilder.Entity<ListeningTopics>().HasKey(lt => new { lt.ListeningID, lt.TopicID });

            // --- B. CẤU HÌNH CHI TIẾT QUAN HỆ ---

            // 1. Examples: Cascade Delete
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
                e.HasOne(x => x.Vocabulary).WithMany(v => v.Examples).HasForeignKey(x => x.VocabID).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Grammar).WithMany(g => g.Examples).HasForeignKey(x => x.GrammarID).OnDelete(DeleteBehavior.Cascade);
            });

            // 2. Vocab Many-to-Many (Kanjis, Topics, WordTypes)
            // Cấu hình Vocabularies & Kanjis (Many-to-Many qua VocabularyKanjis) ---
            modelBuilder.Entity<VocabularyKanjis>()
                .HasOne(vk => vk.Vocabulary).WithMany(v => v.RelatedKanjis).HasForeignKey(vk => vk.VocabID);

            modelBuilder.Entity<VocabTopics>()
                .HasOne(vt => vt.Vocabulary).WithMany(v => v.VocabTopics).HasForeignKey(vt => vt.VocabID);
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

            modelBuilder.Entity<VocabWordTypes>()
                .HasOne(vw => vw.Vocabulary).WithMany(v => v.VocabWordTypes).HasForeignKey(vw => vw.VocabID);

            // 3. Grammar Many-to-Many (Topics) - MỚI
            modelBuilder.Entity<GrammarTopics>()
                .HasOne(gt => gt.Grammar).WithMany(g => g.GrammarTopics).HasForeignKey(gt => gt.GrammarID);
            modelBuilder.Entity<GrammarTopics>()
                .HasOne(gt => gt.Topic).WithMany(t => t.GrammarTopics).HasForeignKey(gt => gt.TopicID);

            // 4. Reading Many-to-Many (Topics) - MỚI
            modelBuilder.Entity<ReadingTopics>()
                .HasOne(rt => rt.Reading).WithMany(r => r.ReadingTopics).HasForeignKey(rt => rt.ReadingID);
            modelBuilder.Entity<ReadingTopics>()
                .HasOne(rt => rt.Topic).WithMany(t => t.ReadingTopics).HasForeignKey(rt => rt.TopicID);

            // 5. Listening Many-to-Many (Topics) - MỚI
            modelBuilder.Entity<ListeningTopics>()
                .HasOne(lt => lt.Listening).WithMany(l => l.ListeningTopics).HasForeignKey(lt => lt.ListeningID);
            modelBuilder.Entity<ListeningTopics>()
                .HasOne(lt => lt.Topic).WithMany(t => t.ListeningTopics).HasForeignKey(lt => lt.TopicID);

            // 6. Cấu hình Kanjis & Radicals
            modelBuilder.Entity<Kanjis>(e => {
                e.HasOne(x => x.Radical).WithMany(r => r.Kanjis).HasForeignKey(x => x.RadicalID).OnDelete(DeleteBehavior.SetNull);
                e.Property(x => x.Status).HasConversion<int>().HasDefaultValue(Status.Published);
            });

            // 7. Cấu hình Grammars
            modelBuilder.Entity<Grammars>(e => {
                e.HasOne(x => x.GrammarGroup).WithMany(gg => gg.Grammars).HasForeignKey(x => x.GrammarGroupID).OnDelete(DeleteBehavior.SetNull);
                e.Property(x => x.Formality).HasConversion<int>();
                e.Property(x => x.Status).HasConversion<int>().HasDefaultValue(Status.Published);
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

            // --- C. CẤU HÌNH QUESTIONS & ANSWERS ---
            modelBuilder.Entity<Questions>(e => {
                e.HasOne(q => q.ParentQuestion).WithMany(q => q.SubQuestions).HasForeignKey(q => q.ParentID).OnDelete(DeleteBehavior.Restrict);
                e.Property(q => q.QuestionType).HasConversion<int>();
                e.Property(q => q.Status).HasConversion<int>().HasDefaultValue(Status.Published);
            });

            // --- D. ĐĂNG KÝ ENUMS ---
            modelBuilder.Entity<Lessons>().Property(l => l.SkillType).HasConversion<string>();

            // --- E. GLOBAL RESTRICTIONS ---
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