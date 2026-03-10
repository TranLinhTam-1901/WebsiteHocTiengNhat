export enum QuestionType {
    MultipleChoice = 0,
    FillInTheBlank = 1,
    Matching = 2,
    // Thêm các loại khác khớp với QuestionType Enum trong C# của bạn
}

export enum QuestionStatus {
    Published = 0, // Thay cho Active
    Draft = 1,
    Archived = 2   // Thay cho Inactive
}

export interface AnswerDTO {
    answerID?: string;
    questionID?: string;
    answerText: string; // ĐỔI TỪ content -> answerText
    isCorrect: boolean;
    displayOrder?: number;
}

export interface QuestionDTO {
    questionID?: string;
    readingID?: string | null;
    lessonID: string;
    content: string; // Nội dung câu hỏi
    questionType: QuestionType;
    audioURL?: string | null;
    difficulty: number;
    explanation?: string | null;
    status: QuestionStatus;
    
    // Phục vụ cho câu hỏi phân cấp (nếu bài đọc có nhiều nhóm câu hỏi)
    parentID?: string | null;
    subQuestions?: QuestionDTO[]; 
    
    // Danh sách đáp án đi kèm
    answers: AnswerDTO[];
    
    // Metadata (Tùy chọn nếu cần hiển thị)
    mediaTimestamp?: string | null;
}