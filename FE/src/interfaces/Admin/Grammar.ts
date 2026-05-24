import { TopicItem } from "./Topic";

export interface GrammarExampleItem {
    exampleID?: string | null; // Thêm ID để hỗ trợ cập nhật ví dụ cũ
    content: string;
    translation: string;
    audioURL?: string | null;
}

export interface GrammarItem {
    id: string;              // GrammarID
    title: string;           
    structure: string;       
    meaning: string;         
    explanation: string;     // Thêm trường giải thích
    grammarType: number;     // Mapping với Enum GrammarCategory
    formality: number;       // Mapping với Enum FormalityLevel
    groupName?: string;
    usageNote?: string | null;
    status: number;
    
    levelID: string;
    lessonID: string;
    levelName: string;       
    lessonName: string;      // Thêm tên bài học
    topics: TopicItem[];
    
    createdAt: string;
    updatedAt: string;
    examples: GrammarExampleItem[];
    displayTitle: string;    // Title — Structure
}

export interface CreateUpdateGrammarDTO {
    title: string;
    structure: string;
    meaning: string;
    explanation: string;
    grammarType: number;     // Đồng bộ với backend
    formality: number;       // Giá trị số (0, 1, 2...)
    grammarGroupID?: string | null;
    usageNote?: string | null;
    status: number;
    
    levelID: string;
    topicIDs: string[];
    lessonID: string;
    examples: GrammarExampleItem[];
}