export interface AdminDashboardSummary {
  totalLearners: number;
  onlineLearners: number;
  lockedLearners: number;
  averagePassRatePercent: number;
  averageLessonProgressPercent: number;
  activeLearnersLast7Days: number;
  activityTrendPercent: number | null;
}

export interface AdminActivityDay {
  label: string;
  date: string;
  examSessions: number;
  lessonAccesses: number;
}

export interface AdminLevelDistribution {
  levelId: string | null;
  levelName: string;
  learnerCount: number;
}

export interface AdminTopWrongQuestion {
  questionId: string;
  content: string;
  levelName: string;
  skillType: string;
  skillTypeLabel: string;
  wrongRatePercent: number;
  attemptCount: number;
}

export interface AdminRecentLearner {
  userId: string;
  fullName: string;
  email: string;
  levelName: string;
  lastActivityAt: string | null;
  completedLessons: number;
}

export interface AdminContentStats {
  questions: number;
  publishedExams: number;
  lessons: number;
  vocabularies: number;
}

export interface AdminDashboardOverview {
  summary: AdminDashboardSummary;
  activityLast7Days: AdminActivityDay[];
  learnersByLevel: AdminLevelDistribution[];
  topWrongQuestions: AdminTopWrongQuestion[];
  recentActiveLearners: AdminRecentLearner[];
  contentStats: AdminContentStats;
  generatedAt: string;
}
