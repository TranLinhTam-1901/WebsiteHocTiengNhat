import { SkillType } from "../Admin/QuestionBank";

export interface FlashcardContentDTO {
    kanji: string;
    furigana: string;
    meaning: string;
}

export interface FlashcardReviewDTO {
    itemID: string;
    itemType: SkillType;
    nextReview: string;
    entity: FlashcardContentDTO;
}

export interface FlashcardItemDTO {
    itemID: string;
    entityID: string;
    itemType: SkillType;
    nextReview: string;
    ef: number;
    interval: number;
    isMastered: boolean;
    kanji: string;
    meaning: string;
}

export interface UserDeckDTO {
    deckID: string;
    skillType: SkillType;
    skillName: string;
    topicName?: string | null;
    levelName?: string | null;
    totalCards: number;
    dueCount: number;
    newCards: number;
}

export interface ReviewUpdateDto {
    itemId: string;
    quality: number; // 0-5
    timeTaken: number;
}

export interface AddFlashcardDto {
    entityId: string;
    itemType: SkillType;
}

export interface CreateDeckDto {
    name: string;
    description?: string;
    levelId?: string;
    itemIds?: string[];
}
