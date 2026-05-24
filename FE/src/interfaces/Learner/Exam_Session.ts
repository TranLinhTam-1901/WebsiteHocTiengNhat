export interface SessionAnswerDTO {
  questionID: string;

  selectedAnswerID?: string | null;

  textAnswer?: string | null;

  responseTime: number;
}

export interface ExamSessionDTO {
  sessionID: string;

  remainingTime: number;

  status: number;

  startedAt: string;

  expiresAt: string;

  lastAccessedAt: string;

  answers: SessionAnswerDTO[];

  exam: any[];
}

export interface SaveExamProgressDTO {
  sessionID: string;

  answers: SessionAnswerDTO[];
}