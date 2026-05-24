import { ExamType, QuestionType, QuestionFormat } from '../../interfaces/Admin/QuestionBank';

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

  isCorrect?: boolean;
  isSelected?: boolean;
}

export interface QuestionDisplayDTO {
  questionID: string;
  content: string;
  questionType: QuestionType; // 0: MultipleChoice, 1: FillInBlank, 2: Ordering, 3: Synonym, 4: Usage, 5: TextCompletion, 6: ListeningComp, 7: ReadingComp
  questionFormat: QuestionFormat; // 0: StandardChoice, 1: StarSentence, 2: Passage, 3: AudioChoice
  imageURL?: string | null;
  audioURL?: string | null;
  mediaTimestamp?: number | null;
  readingContent?: string | null;
  listeningScript?: string | null;
  displayOrder?: number | null;
  totalSubQuestions: number;

  options: AnswerOptionDTO[];
  subQuestions: QuestionDisplayDTO[];

}

export interface SubQuestionDTO {
  questionID: string;

  content: string;

  options: AnswerOptionDTO[];
}

export interface ExamTreeItemDTO {
  type: string;

  questionID?: string;

  readingID?: string;
  listeningID?: string;

  orderIndex?: number;

  score?: number;

  skillType: string;

  content: string;

  audioUrl?: string | null;

  script?: string | null;

  imageURL?: string | null;

  options: AnswerOptionDTO[];

  subQuestions: QuestionDisplayDTO[];
}

export interface ExamDisplayDTO {
  examID: string;
  title: string;
  duration: number;
  
  version: number;

  sections: ExamTreeItemDTO[];
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
  answers: AnswerOptionDTO[];
  explanation?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  subQuestions?: ExamReviewQuestionDTO[];
}

export interface ExamReviewTreeItemDTO {
  type: string;

  skillType: string;

  content?: string | null;

  audioUrl?: string | null;

  script?: string | null;

  imageURL?: string | null;

  orderIndex?: number | null;

  score?: number | null;

  questionID?: string | null;

  isCorrect?: boolean | null;

  responseTime?: number | null;

  answers: AnswerOptionDTO[];

  subQuestions: ExamReviewQuestionDTO[];
}

// export interface ExamReviewAnswerDTO {
//   answerID: string;
//   answerText: string;

//   isCorrect: boolean;
//   isSelected: boolean;
// }
export interface SubmitExamResultDTO {
  resultID: string;
  examID: string;
  examTitle: string;
  examDuration: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;

  isPassed?: boolean | null;
  passingScore?: number | null;
  sectionScores?: ExamResultSectionScoreDTO[] | null;
  
  sections: ExamReviewTreeItemDTO[];
}


export interface ExamResultListItemDTO {
    resultID: string;
    examID: string;
    examTitle: string;
    examType: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    isPassed?: boolean | null;
    createdAt: string;
}

export interface ExamResultSectionScoreDTO {
  sectionName: string;
  score: number;
  minScore: number;
  correctAnswers: number;
  totalQuestions: number;
  isPassed: boolean;
}

// JLPT MOCK TEST

export interface ExamListItemDTO {
  examID: string;
  title: string;
  levelName: string;

  duration: number;

  totalScore: number;
  passingScore: number;

  totalQuestions: number;

  examType: ExamType;

  version: number;

  showResultImmediately: boolean;
}

export interface MinScoreDTO {
  language: number;
  reading: number;
  listening: number;
}

export interface ExamSectionSummaryDTO {
  skillType: number;
  skillName: string;

  totalQuestions: number;
  totalPoints: number;
}

export interface ExamSummaryDTO {
  examID: string;

  title: string;
  levelName: string;

  duration: number;

  totalQuestions: number;

  totalScore: number;
  passingScore: number;

  minScores: MinScoreDTO;

  sections: ExamSectionSummaryDTO[];
}

export interface JLPTPartDTO {
  partKey: string;

  partName: string;

  totalQuestions: number;

  hasSharedContent: boolean;

  questionFormat: QuestionFormat;

  questions: QuestionDisplayDTO[];
}

export interface ExamSectionDTO {
  skillType: number;

  skillName: string;

  parts: JLPTPartDTO[];
}

export interface ExamStructuredDTO {
  examID: string;

  title: string;

  duration: number;

  version: number;

  sections: ExamSectionDTO[];
}