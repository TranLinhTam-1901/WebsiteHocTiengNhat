import { SkillType } from "../Admin/QuestionBank";

export interface SkillPracticeDTO {
    levelId?: string | null;
    topicIds?: string[];
    lessonIds?: string[];
    wordTypeIds?: string[];
    grammarGroupIds?: string[];
    radicalIds?: string[];
    
    // Lọc nâng cao qua bảng Grammar
    grammarType: number;
    formality: number;
    
    limit: number;
}


export interface SkillPracticeExamDTO {
  examID: string;
  title: string;
  duration: number;
  targetSkill: SkillType;
  bestScore: number;
  isCompleted: boolean;
  hasNewVersion: boolean;
  latestResultID?: string;
}