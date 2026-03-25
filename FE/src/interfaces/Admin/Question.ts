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
    // Liên kết bài đọc/nghe
    readingID?: string | null;
    listeningID?: string | null; // Mới bổ sung từ Model C#
    
    lessonID: string;
    content: string;
    questionType: QuestionType;
    
    // Media
    audioURL?: string | null;
    imageURL?: string | null; // Đồng bộ với ImageURL trong C#
    
    difficulty: number;
    explanation?: string | null;
    status: QuestionStatus;
    
    // Phục vụ cho câu hỏi bài nghe/đọc
    mediaTimestamp?: string | null; // Mốc thời gian (vd: 01:25)
    displayOrder?: number | null;   // Thứ tự hiển thị
    equivalentID?: string | null;  // ID câu hỏi tương đương
    
    // Nguồn gốc & Phân cấp
    sourceID?: string | null;
    parentID?: string | null;
    subQuestions?: QuestionDTO[]; 
    
    // Danh sách đáp án
    answers: AnswerDTO[];
}