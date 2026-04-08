import { ExamType } from "./QuestionBank";
import{SkillType} from "./QuestionBank";
// Cấu hình chi tiết từng phần (Map với ExamPartConfigDTO)
export interface ExamPartConfig {
    skillType: SkillType;
    quantity: number;
    pointPerQuestion: number;
}

// Request gửi lên API generate
export interface GenerateExamRequest {
    title: string;
    duration: number;
    levelID: string;
    type: ExamType;
    lessonID?: string | null;
    showResultImmediately: boolean;
    passingScore: number;
    minLanguageKnowledgeScore: number;
    minReadingScore: number;
    minListeningScore: number;
    parts: ExamPartConfig[];
}

// Kết quả trả về từ API Summary
export interface ExamSummaryResponse {
    totalQuestions: number;
    totalScore: number;
}

// Interface cho danh sách đề thi
export interface ExamListResponse {
    examID: string;
    title: string;
    levelName: string;
    type: ExamType;
    lessonTitle: string | null;
    totalQuestions: number;
    totalScore: number;
    duration: number;
    createdAt: string;
    isPublished: boolean;
}

// Interface cho chi tiết 
export interface ExamDetailResponse {
    examID: string;
    title: string;
    passingScore: number;
    duration: number;
    examType: ExamType;
    showResultImmediately: boolean;
    minScores: {
        language: number;
        reading: number;
        listening: number;
    };
    questions: {
        questionID: string;
        orderIndex: number;
        content: string;
        skillType: string;
        score: number;
    }[];

    
}

export interface UpdateExamRequest {
    title: string;
    duration: number;
    passingScore: number;
    minLanguageKnowledgeScore: number;
    minReadingScore: number;
    minListeningScore: number;
    showResultImmediately: boolean;
}