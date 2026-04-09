export interface UserAnswerHistory {
    historyID: string; // Guid bên C# là string bên TS
    userID: string;
    questionID: string;
    selectedAnswerID?: string | null;
    textAnswer?: string | null;
    isCorrect: boolean;
    answeredAt: string; // ISO Date string
    timeTaken: number; // giây
}

export interface AnswerSubmissionDto {
    questionId: string;
    selectedAnswerId?: string | null;
    textAnswer?: string | null;
    timeTaken: number;
}