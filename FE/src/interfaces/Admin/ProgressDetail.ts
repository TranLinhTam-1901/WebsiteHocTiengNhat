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