import { SkillType } from '../../interfaces/Admin/QuestionBank';

export interface SkillHubItemDTO {
  examID: string;
  title: string;
  courseID?: string | null;
  courseName?: string | null;
  lessonID?: string | null;
  sortOrder: number;
  isCheckpoint: boolean;
  isPublished: boolean;
  bestScore?: number | null;
  levelID?: string | null;
}

export interface SkillHubGroupDTO {
  skillType: SkillType;
  skillName: string;
  currentProficiency: number;
  needsReview: boolean;
  items: SkillHubItemDTO[];
}
