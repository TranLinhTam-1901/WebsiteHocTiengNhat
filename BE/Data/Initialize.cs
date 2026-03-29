using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

public static class Data
{
    public static async Task Initialize(ApplicationDbContext context)
    {
        // Kiểm tra nếu đã có dữ liệu thì không tạo thêm
        if (context.ExamTemplates.Any()) return;

        var n3Id = context.JLPT_Levels.FirstOrDefault(l => l.LevelName == "N3")?.LevelID;
        var n4Id = context.JLPT_Levels.FirstOrDefault(l => l.LevelName == "N4")?.LevelID;
        var n5Id = context.JLPT_Levels.FirstOrDefault(l => l.LevelName == "N5")?.LevelID;
        // --- 1. MẪU N3 CHUẨN ---
        var n3Template = new ExamTemplate
        {
            TemplateID = Guid.NewGuid(),
            Title = "Cấu trúc JLPT N3 Chuẩn",
            LevelID = n3Id.Value, // Nếu không tìm thấy N3 thì tạo mới ID giả (không liên kết)
            Duration = 180,
            TotalMaxScore = 180,
            PassingScore = 95,
            MinLanguageKnowledgeScore = 19,
            MinReadingScore = 19,
            MinListeningScore = 19,

        };

        var n3Details = new List<ExamTemplateDetail>
        {
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Vocabulary, Quantity = 35, PointPerQuestion = 1.0m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Grammar, Quantity = 23, PointPerQuestion = 1.087m },
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Reading, Quantity = 16, PointPerQuestion = 3.75m }, // 16 * 3.75 = 60đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n3Template.TemplateID, SkillType = SkillType.Listening, Quantity = 28, PointPerQuestion = 2.1429m } // 28 * 2.14 ~ 60đ
        };

        // --- 2. MẪU N4 CHUẨN ---
        var n4Template = new ExamTemplate
        {
            TemplateID = Guid.NewGuid(),
            Title = "Cấu trúc JLPT N4 Chuẩn",
            LevelID = n4Id.Value,
            Duration = 155,
            TotalMaxScore = 180,
            PassingScore = 90,
            MinLanguageKnowledgeScore = 38, // N4 liệt gộp
            MinReadingScore = 0, // Không dùng cho N4 liệt gộp
            MinListeningScore = 19,

        };

        var n4Details = new List<ExamTemplateDetail>
        {
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Vocabulary, Quantity = 30, PointPerQuestion = 1.5m }, // 45đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Grammar, Quantity = 25, PointPerQuestion = 1.5m },    // 37.5đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Reading, Quantity = 10, PointPerQuestion = 3.75m },  // 37.5đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n4Template.TemplateID, SkillType = SkillType.Listening, Quantity = 25, PointPerQuestion = 2.4m }   // 60đ
        };

        // --- 3. MẪU N5 CHUẨN ---
        var n5Template = new ExamTemplate
        {
            TemplateID = Guid.NewGuid(),
            Title = "Cấu trúc JLPT N5 Chuẩn",
            LevelID = n5Id.Value,
            Duration = 140,
            TotalMaxScore = 180,
            PassingScore = 80,
            MinLanguageKnowledgeScore = 38,
            MinReadingScore = 0,
            MinListeningScore = 19,

        };

        var n5Details = new List<ExamTemplateDetail>
        {
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Vocabulary, Quantity = 25, PointPerQuestion = 2.0m }, // 50đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Grammar, Quantity = 20, PointPerQuestion = 1.75m },  // 35đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Reading, Quantity = 10, PointPerQuestion = 3.5m },   // 35đ
            new ExamTemplateDetail { DetailID = Guid.NewGuid(), TemplateID = n5Template.TemplateID, SkillType = SkillType.Listening, Quantity = 20, PointPerQuestion = 3.0m }   // 60đ
        };

        // Lưu vào cơ sở dữ liệu
        context.ExamTemplates.AddRange(n3Template, n4Template, n5Template);
        context.ExamTemplateDetails.AddRange(n3Details);
        context.ExamTemplateDetails.AddRange(n4Details);
        context.ExamTemplateDetails.AddRange(n5Details);

        context.SaveChanges();
    }
}