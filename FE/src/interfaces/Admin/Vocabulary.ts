export interface ExampleItem {
    content: string;
    translation: string;
}

export interface VocabularyItem {
    vocabID: string;
    word: string;
    reading: string;
    meaning: string;
    wordType: string;
    isCommon: boolean;
    mnemonics?: string;
    imageURL?: string;
    audioURL?: string;
    priority: number;
    status: number; // 0: Draft, 1: Active, 2: Hidden
    
    levelID: string;
    topicID: string;
    lessonID: string;
    
    levelName: string; // Trả về từ Get-all
    topicName: string; // Trả về từ Get-all
    updatedAt: string;

    // Chi tiết (dùng cho GetById)
    examples: ExampleItem[];
    relatedKanjiIDs?: string[];
}

export interface CreateUpdateVocabDTO {
    word: string;
    reading: string;
    meaning: string;
    wordType: string;
    isCommon: boolean;
    mnemonics?: string | null;
    imageURL?: string | null; // Base64 string khi upload
    audioURL?: string | null; // Base64 string khi upload (Backend dùng dto.AudioURL)
    priority: number;
    status: number;
    levelID: string;
    topicID: string;
    lessonID: string;
    examples: ExampleItem[];
    relatedKanjiIDs?: { 
        KanjiID: string; 
        character: string; 
        onyomi: string;
        kunyomi: string;
        meaning: string; 
  }[];
}