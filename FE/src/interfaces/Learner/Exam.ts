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


export interface AnswerOptionDTO {
  answerID: string;
  answerText: string;
}

export interface QuestionDisplayDTO {
  questionID: string;
  content: string;
  imageURL?: string | null;
  audioURL?: string | null;
  readingContent?: string | null;
  options: AnswerOptionDTO[];
  subQuestions: QuestionDisplayDTO[];
}

export interface ExamDisplayDTO {
  examID: string;
  title: string;
  duration: number;
  questions: QuestionDisplayDTO[];
}

// DTO để nộp bài
export interface UserAnswerSelectionDTO {
  questionID: string;
  selectedAnswerID?: string | null;
  textAnswer?: string | null;
  responseTime: number;
}

export interface SubmitExamRequestDTO {
  examID: string;
  totalTimeSpent: number;
  answers: UserAnswerSelectionDTO[];
}

export interface ExamReviewQuestionDTO {
  questionID: string;
  content: string;
  isCorrect: boolean;
  responseTime: number;
  selectedAnswerID?: string | null;
  selectedAnswerText?: string | null;
  correctAnswerID?: string | null;
  correctAnswerText?: string | null;
}

export interface SubmitExamResultDTO {
  resultID: string;
  examID: string;
  examTitle: string;
  examDuration: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  questions: ExamReviewQuestionDTO[];
}