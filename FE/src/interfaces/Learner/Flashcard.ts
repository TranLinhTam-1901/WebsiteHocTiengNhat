import { SkillType } from "../Admin/QuestionBank";

export interface FlashcardExampleDTO {
    content: string;
    translation: string;
}

export interface FlashcardContentDTO {
    kanji: string;
    furigana: string;
    meaning: string;
    example?: string;
    kunyomi?: string;
    onyomi?: string;
    explanation?: string;
    examples?: FlashcardExampleDTO[];
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

export type DeckSuggestedAction = 'learn' | 'continue' | 'review' | 'complete' | 'empty';

export interface UserDeckDTO {
    deckID: string;
    skillType: SkillType;
    skillName: string;
    topicName?: string | null;
    description?: string | null;
    isUserCustomDeck?: boolean;
    levelName?: string | null;
    totalCards: number;
    masteredCount?: number;
    progressPercent?: number;
    dueCount: number;
    newCards: number;
    suggestedAction?: DeckSuggestedAction;
    earliestNextReviewUtc?: string | null;
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

export interface DeckItemRefDto {
    entityId: string;
    itemType: SkillType;
}

export interface CreateDeckDto {
    name: string;
    description?: string;
    items: DeckItemRefDto[];
}

export interface UpdateDeckDto extends CreateDeckDto {}
