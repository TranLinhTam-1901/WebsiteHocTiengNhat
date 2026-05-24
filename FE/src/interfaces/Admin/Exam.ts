import { ExamType, QuestionFormat } from "./QuestionBank";
import{SkillType} from "./QuestionBank";
// Cấu hình chi tiết từng phần (Map với ExamPartConfigDTO)
export interface ExamPartConfig {
    skillType: SkillType;
    questionFormat? : QuestionFormat;
    quantity: number;
    pointPerQuestion: number;
}
export interface CourseLookupResponse {
    courseID: string;
    courseName: string;
}

// Interface cho thống kê kỹ năng trong từng bài học
export interface LessonSkillStat {
    skillId: number;
    skillName: string;
    totalQuestions: number;
}

// Interface cho bài học trả về từ API lọc
export interface LessonFilterResponse {
    lessonID: string;
    title: string;
    courseID?: string;
    courseName?: string;
    rawItemCount: number;
    skillStats: LessonSkillStat[];
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
    duration?: number;
    examType: ExamType;
    totalScore: number;
    levelID?: string;
    lessonID?: string;
    courseID?: string;
    courseName?: string;
    levelName?: string;
    lessonTitle?: string;
    showResultImmediately: boolean;
    minScores: {
        language: number;
        reading: number;
        listening: number;
    };
    parts?: ExamPartConfig[];
    questions: ExamQuestionDetail[];
}

export interface ExamQuestionDetail {
    questionID: string;
    orderIndex: number;
    content: string;
    skillType: string;

    // Reading/Listening cha có thể không có score
    score?: number;
    isGroup?: boolean;
    // Question con
    subQuestions?: ExamQuestionDetail[];
}

export interface UpdateExamRequest {
    title: string;
    duration: number;
    passingScore: number;
    minLanguageKnowledgeScore: number;
    minReadingScore: number;
    minListeningScore: number;
    showResultImmediately: boolean;
    parts?: ExamPartConfig[];
}