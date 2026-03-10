export interface GrammarExampleItem {
    content: string;
    translation: string;
    audioURL?: string | null;
}

export interface GrammarItem {
    GrammarID: string;              // GrammarID
    title: string;           
    structure: string;       
    meaning: string;         
    levelName: string;       
    topicName: string;       
    status: number;
    updatedAt: string;

    examples: GrammarExampleItem[];
}

export interface CreateUpdateGrammarDTO {
    title: string;
    structure: string;
    meaning: string;
    explanation: string;
    formality?: string | null;
    similarGrammar?: string | null;
    usageNote?: string | null;
    status: number;
    
    levelID: string;
    topicID: string;
    lessonID: string;
    examples: GrammarExampleItem[];
}