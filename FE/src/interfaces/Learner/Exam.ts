import { ExamType } from '../../interfaces/Admin/QuestionBank';

export interface LearnerExamListItem {
  examID: string;
  title: string;
  type: ExamType;
  levelName: string;
  lessonTitle?: string | null;
  courseName?: string | null;
  totalQuestions?: number;
  totalScore?: number;
  duration?: number;
  isPublished?: boolean;
  bestScore?: number | null;
}

export interface LearnerExamFilters {
  search?: string;
  levelId?: string;
  type?: ExamType;
}
