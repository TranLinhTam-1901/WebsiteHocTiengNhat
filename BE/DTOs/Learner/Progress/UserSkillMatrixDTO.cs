using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.DTOs.Learner.Progress;

public class UserSkillMatrixItemDTO
{
    public SkillType SkillType { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int ProficiencyScore { get; set; }
    public int Confidence { get; set; }
    public bool NeedsReview { get; set; }
    public string? LevelName { get; set; }
    public DateTime? LastUpdated { get; set; }
}

public class UserSkillMatrixResponseDTO
{
    public List<UserSkillMatrixItemDTO> Skills { get; set; } = new();
    public double AverageProficiency { get; set; }
    public int SkillsNeedingReview { get; set; }
}
