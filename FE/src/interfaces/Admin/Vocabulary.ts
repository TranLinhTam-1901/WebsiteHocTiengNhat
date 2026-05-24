import { TopicItem } from "./Topic";

export interface ExampleItem {
    id?: string;
    content: string;
    translation: string;
}

export interface WordTypeItem {
    id: string; // Hoặc Guid
    name: string; // Danh từ, Động từ, Tính từ...
}

export interface RelatedKanjiItem {
    KanjiID: string; 
    character: string; 
    onyomi: string;
    kunyomi: string;
    meaning: string; 
}

export interface VocabularyItem {
    vocabID: string;
    word: string;
    reading: string;
    meaning: string;
    wordTypes: WordTypeItem[];
    isCommon: boolean;
    mnemonics?: string;
    imageURL?: string;
    audioURL?: string;
    priority: number;
    status: number;
    
    levelID: string;
    lessonID: string;
    levelName: string;
    lessonName: string;
    topics: TopicItem[];

    createdAt: string;
    updatedAt: string;

    // Chi tiết (dùng cho GetById)
    examples: ExampleItem[];
    relatedKanjis?: RelatedKanjiItem[];
}

export interface CreateUpdateVocabDTO {
    word: string;
    reading: string;
    meaning: string;
    wordTypeIDs: string[];
    isCommon: boolean;
    mnemonics?: string | null;
    imageURL?: string | null; // Base64 string khi upload
    audioURL?: string | null; // Base64 string khi upload (Backend dùng dto.AudioURL)
    priority: number;
    status: number;
    levelID: string;
    topicIDs: string[];
    lessonID: string;
    examples: ExampleItem[];
    relatedKanjis?: RelatedKanjiItem[];
}