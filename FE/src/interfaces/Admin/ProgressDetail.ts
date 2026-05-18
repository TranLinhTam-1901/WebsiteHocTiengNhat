import { ExamProgress } from '../../interfaces/Learner/Dashboard';
export interface ProgressDetailResponse {
  totalPercent: number;
  currentLevelName: string;
  courseProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  skillProgress: {
    mastered: number;
    total: number;
    percentage: number;
  };
}



export interface ProgressDetail {
  total: number;
  completed: number;
  percentage: number;
}

export interface DashboardProgressResponse {
  currentLevelName: string;
  totalPercent: number;

  courseProgress: ProgressDetail;

  examProgress: ExamProgress;

  skillProgress: ProgressDetail;
}