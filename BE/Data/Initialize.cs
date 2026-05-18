using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using Microsoft.EntityFrameworkCore;
public static class Data
{
    public static async Task Initialize(ApplicationDbContext context)
    {
        

        var n3Id = context.JLPT_Levels.FirstOrDefault(l => l.LevelName == "N3")?.LevelID;
        var n4Id = context.JLPT_Levels.FirstOrDefault(l => l.LevelName == "N4")?.LevelID;
        var n5Id = context.JLPT_Levels.FirstOrDefault(l => l.LevelName == "N5")?.LevelID;

        // Nếu chưa có N3/N4/N5 thì tạo mới để tránh lỗi khóa ngoại khi tạo mẫu đề thi
        var n3Version = 1;

        var n3Exists = await context.ExamTemplates
            .AnyAsync(x =>
                x.LevelID == n3Id &&
                x.Version == n3Version);
        if (!n3Exists)
        {
            // --- 1. MẪU N3 CHUẨN ---
        var n3Template = new ExamTemplate
        {
            TemplateID = Guid.NewGuid(),
            Title = "Cấu trúc JLPT N3 Chuẩn",
            LevelID = n3Id.Value, // Nếu không tìm thấy N3 thì tạo mới ID giả (không liên kết)
            Duration = 130,
            TotalMaxScore = 180,
            PassingScore = 95,
            MinLanguageKnowledgeScore = 19,
            MinReadingScore = 19,
            MinListeningScore = 19,
            Version = n3Version,
            IsActive = true,

        };

        var n3Details = new List<ExamTemplateDetail>
        {
           // Kiến thức ngôn ngữ (Tổng: 59 câu = tròn 60.00 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Vocabulary, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 25, PointPerQuestion = 1.00m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Grammar, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 15, PointPerQuestion = 1.00m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Grammar, QuestionFormat = QuestionFormat.StarSentence, Quantity = 5, PointPerQuestion = 1.00m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Kanji, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 14, PointPerQuestion = 1.0714285714285714m }, // 14 * 1.071428... = đúng 15 điểm
            
            // Đọc hiểu (Tổng: 16 câu = tròn 60.00 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Reading, QuestionFormat = QuestionFormat.Passage, Quantity = 12, PointPerQuestion = 4.25m }, // 51 điểm
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Reading, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 4, PointPerQuestion = 2.25m }, // 9 điểm
            
            // Nghe hiểu (Tổng: 25 câu = tròn 60.00 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Listening, QuestionFormat = QuestionFormat.AudioChoice, Quantity = 25, PointPerQuestion = 2.40m } // 60 điểm
        };
        context.ExamTemplates.AddRange(n3Template);
        context.ExamTemplateDetails.AddRange(n3Details);
        }
        

       
        var n4Version = 1;

        var n4Exists = await context.ExamTemplates
            .AnyAsync(x =>
                x.LevelID == n4Id &&
                x.Version == n4Version);
        if (!n4Exists)
        {
        // --- 2. MẪU N4 CHUẨN ---
        var n4Template = new ExamTemplate
        {
            TemplateID = Guid.NewGuid(),
            Title = "Cấu trúc JLPT N4 Chuẩn",
            LevelID = n4Id.Value,
            Duration = 115,
            TotalMaxScore = 180,
            PassingScore = 90,
            MinLanguageKnowledgeScore = 38,
            MinReadingScore = 0,
            MinListeningScore = 19,
            Version = 1,
            IsActive = true,
        };

        var n4Details = new List<ExamTemplateDetail>
        {
            // Kiến thức ngôn ngữ (Tổng: 60 câu = 60 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Vocabulary, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 20, PointPerQuestion = 1.00m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Grammar, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 15, PointPerQuestion = 1.00m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Grammar, QuestionFormat = QuestionFormat.StarSentence, Quantity = 5, PointPerQuestion = 1.00m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Kanji, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 20, PointPerQuestion = 1.00m },
            
            // Đọc hiểu (Tổng: 15 câu = 60 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Reading, QuestionFormat = QuestionFormat.Passage, Quantity = 10, PointPerQuestion = 4.50m }, 
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Reading, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 5, PointPerQuestion = 3.00m },
            
            // Nghe hiểu (Tổng: 15 câu = 60 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Listening, QuestionFormat = QuestionFormat.AudioChoice, Quantity = 15, PointPerQuestion = 4.00m }
        };

        context.ExamTemplates.AddRange(n4Template);
        context.ExamTemplateDetails.AddRange(n4Details);
        }

        var n5Version = 1;

        var n5Exists = await context.ExamTemplates
            .AnyAsync(x =>
                x.LevelID == n5Id &&
                x.Version == n5Version);
        if (!n5Exists)
        {
        // --- 3. MẪU N5 CHUẨN ---
        var n5Template = new ExamTemplate
        {
            TemplateID = Guid.NewGuid(),
            Title = "Cấu trúc JLPT N5 Chuẩn",
            LevelID = n5Id.Value,
            Duration = 105,
            TotalMaxScore = 180,
            PassingScore = 80,
            MinLanguageKnowledgeScore = 38,
            MinReadingScore = 0,
            MinListeningScore = 19,
            Version = 1,
            IsActive = true,

        };

        var n5Details = new List<ExamTemplateDetail>
        {
            // Kiến thức ngôn ngữ (Tổng: 45 câu = tròn 60.00 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Vocabulary, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 15, PointPerQuestion = 1.3333333333333333m }, // 15 * 1.333... = đúng 20 điểm
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Grammar, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 15, PointPerQuestion = 1.3333333333333333m }, // 15 * 1.333... = đúng 20 điểm
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Kanji, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 15, PointPerQuestion = 1.3333333333333333m }, // 15 * 1.333... = đúng 20 điểm
            
            // Đọc hiểu (Tổng: 10 câu = tròn 60.00 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Reading, QuestionFormat = QuestionFormat.Passage, Quantity = 6, PointPerQuestion = 7.00m }, // 42 điểm
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Reading, QuestionFormat = QuestionFormat.StandardChoice, Quantity = 4, PointPerQuestion = 4.50m }, // 18 điểm
            
            // Nghe hiểu (Tổng: 20 câu = tròn 60.00 điểm)
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Listening, QuestionFormat = QuestionFormat.AudioChoice, Quantity = 20, PointPerQuestion = 3.00m } // 20 * 3 = đúng 60 điểm
        };

        // Lưu vào cơ sở dữ liệu
        context.ExamTemplates.AddRange(n5Template);
        context.ExamTemplateDetails.AddRange(n5Details);
    }
     await context.SaveChangesAsync();
    }
}