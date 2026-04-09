export interface SkillPracticeDTO {
    levelId?: string | null;
    topicIds?: string[];
    lessonIds?: string[];
    wordTypeIds?: string[];
    grammarGroupIds?: string[];
    radicalIds?: string[];
    
    // Lọc nâng cao qua bảng Grammar
    grammarType: number;
    formality: number;
    
    limit: number;
}