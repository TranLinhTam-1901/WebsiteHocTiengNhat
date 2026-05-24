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

export interface ExamDisplayDTO {
  examID: string;
  title: string;
  duration: number;
  version?: number;
  questions: QuestionDisplayDTO[];
  /** Cây câu hỏi Normal / Reading / Listening từ API */
  sections?: ExamTreeItemDTO[];
}

export interface ExamTreeItemDTO {
  type: 'Normal' | 'Reading' | 'Listening';
  questionID?: string;
  content?: string;
  audioUrl?: string;
  script?: string;
  imageURL?: string | null;
  skillType?: string;
  orderIndex?: number;
  options?: AnswerOptionDTO[];
  subQuestions: Array<{
    questionID: string;
    content: string;
    imageURL?: string | null;
    orderIndex?: number;
    options: AnswerOptionDTO[];
  }>;
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
  answers: ExamReviewAnswerDTO[];
  subQuestions?: ExamReviewQuestionDTO[];
}

export interface ExamReviewAnswerDTO {
  answerID: string;
  answerText: string;

  isCorrect: boolean;
  isSelected: boolean;
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