using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Learner
{
    public class SkillPracticeDTO
    {
        public Guid? LevelId { get; set; }
        public List<Guid>? TopicIds { get; set; }
        public List<Guid>? LessonIds { get; set; }
        public List<Guid>? WordTypeIds { get; set; }
        public List<Guid>? GrammarGroupIds { get; set; }
        public List<Guid>? RadicalIds { get; set; }

        public List<FormalityLevel>? FormalityLevels { get; set; }
        public List<GrammarCategory>? GrammarCategories { get; set; }

        public int Limit { get; set; } = 20;
    }
}
