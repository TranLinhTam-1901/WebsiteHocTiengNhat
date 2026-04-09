import axiosInstance from "../../utils/axiosInstance";
import { SkillType } from "../../interfaces/Admin/QuestionBank";
import { 
    ReviewUpdateDto, 
    AddFlashcardDto, 
    UserDeckDTO, 
    FlashcardItemDTO,
    FlashcardReviewDTO,
    CreateDeckDto,
    UpdateDeckDto
} from "../../interfaces/Learner/Flashcard";

const BASE_PATH = "learner/flashcards";

function mapUserDeckListPayload(data: unknown): UserDeckDTO[] {
    const arr = Array.isArray(data) ? data : [];
    return arr.map((row: Record<string, unknown>) => ({
        deckID: String(row.deckID ?? row.DeckID ?? ''),
        skillType: Number(row.skillType ?? row.SkillType ?? 0) as SkillType,
        skillName: String(row.skillName ?? row.SkillName ?? ''),
        topicName: (row.topicName ?? row.TopicName) as string | null | undefined,
        description: (row.description ?? row.Description) as string | null | undefined,
        isUserCustomDeck: Boolean(row.isUserCustomDeck ?? row.IsUserCustomDeck),
        levelName: (row.levelName ?? row.LevelName) as string | null | undefined,
        totalCards: Number(row.totalCards ?? row.TotalCards ?? 0),
        masteredCount: Number(row.masteredCount ?? row.MasteredCount ?? 0),
        progressPercent: Number(row.progressPercent ?? row.ProgressPercent ?? 0),
        dueCount: Number(row.dueCount ?? row.DueCount ?? 0),
        newCards: Number(row.newCards ?? row.NewCards ?? 0),
        suggestedAction: (row.suggestedAction ?? row.SuggestedAction) as UserDeckDTO['suggestedAction'],
        earliestNextReviewUtc: (row.earliestNextReviewUtc ?? row.EarliestNextReviewUtc) as string | null | undefined,
    }));
}

export const FlashcardService = {
    // 1. Lấy danh sách bộ thẻ kèm thống kê (Trang DeckListPage)
    getDecks: async (): Promise<UserDeckDTO[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/decks`);
        const data = response.data?.$values ?? response.data;
        return mapUserDeckListPayload(data);
    },

    // 2. Lấy danh sách thẻ cần ôn tập hôm nay (SRS)
    getDailyReview: async (skillType?: SkillType): Promise<FlashcardReviewDTO[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/daily-review`, {
            params: { skillType }
        });
        return response.data?.$values ?? response.data;
    },

    // 3. Cập nhật tiến độ sau khi lật thẻ (0-5 điểm)
    updateProgress: async (model: ReviewUpdateDto): Promise<{ nextReview: string; interval: number; message: string }> => {
        const response = await axiosInstance.post(`${BASE_PATH}/update-progress`, model);
        return response.data;
    },

    // 4. Thêm một thực thể (Vocab/Kanji/Grammar) vào kho học tập
    addToDeck: async (model: AddFlashcardDto): Promise<{ message: string }> => {
        const response = await axiosInstance.post(`${BASE_PATH}/add-to-deck`, model);
        return response.data;
    },

    // 5. Lấy danh sách tất cả các mục trong một bộ thẻ
    getDeckItems: async (deckId: string): Promise<FlashcardItemDTO[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/deck-details/${deckId}`);
        const raw = response.data?.$values ?? response.data;
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map((row: Record<string, unknown>) => {
            const r = row;
            return {
                itemID: String(r.itemId ?? r.itemID ?? ''),
                entityID: String(r.entityId ?? r.entityID ?? ''),
                itemType: Number(r.itemType ?? r.ItemType ?? SkillType.Vocabulary) as SkillType,
                nextReview: String(r.nextReview ?? r.NextReview ?? ''),
                ef: Number(r.ef ?? r.EF ?? 0),
                interval: Number(r.interval ?? r.Interval ?? 0),
                isMastered: Boolean(r.isMastered ?? r.IsMastered),
                kanji: String(r.kanji ?? r.Kanji ?? ''),
                meaning: String(r.meaning ?? r.Meaning ?? ''),
            };
        });
    },

    // 6. Lấy thông tin chi tiết của một thẻ học
    getDetails: async (itemId: string): Promise<any> => {
        const response = await axiosInstance.get(`${BASE_PATH}/details/${itemId}`);
        return response.data;
    },

    // 7. Tạo bộ thẻ thủ công (SkillType deck = General trên server)
    createDeck: async (model: CreateDeckDto): Promise<UserDeckDTO[]> => {
        const response = await axiosInstance.post(`${BASE_PATH}/decks`, model);
        return mapUserDeckListPayload(response.data?.$values ?? response.data);
    },

    updateDeck: async (deckId: string, model: UpdateDeckDto): Promise<UserDeckDTO[]> => {
        const response = await axiosInstance.put(`${BASE_PATH}/decks/${deckId}`, model);
        return mapUserDeckListPayload(response.data?.$values ?? response.data);
    },

    deleteDeck: async (deckId: string): Promise<UserDeckDTO[]> => {
        const response = await axiosInstance.delete(`${BASE_PATH}/decks/${deckId}`);
        return mapUserDeckListPayload(response.data?.$values ?? response.data);
    },

    // 8. Lấy danh sách thực thể có sẵn để thêm vào deck (includeOwned: hiện cả mục đã có ở deck khác — dùng khi tạo bộ tùy chỉnh)
    getAvailableEntities: async (levelId: string, type: SkillType, includeOwned = false): Promise<any[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/available-entities`, {
            params: { levelId, type, includeOwned }
        });
        return response.data?.$values ?? response.data;
    },

    getReviewsByDeck: async (deckId: string, mode?: string): Promise<FlashcardReviewDTO[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/review/${deckId}`, {
            params: mode ? { mode } : undefined,
        });
        const data = response.data?.$values ?? response.data;
        return Array.isArray(data) ? data : [];
    },
};
