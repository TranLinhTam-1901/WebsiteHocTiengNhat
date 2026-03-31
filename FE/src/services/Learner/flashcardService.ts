import axiosInstance from "../../utils/axiosInstance";
import { SkillType } from "../../interfaces/Admin/QuestionBank";
import { 
    ReviewUpdateDto, 
    AddFlashcardDto, 
    UserDeckDTO, 
    FlashcardItemDTO,
    FlashcardReviewDTO,
    CreateDeckDto
} from "../../interfaces/Learner/Flashcard";

const BASE_PATH = "learner/flashcards";

export const FlashcardService = {
    // 1. Lấy danh sách bộ thẻ kèm thống kê (Trang DeckListPage)
    getDecks: async (): Promise<UserDeckDTO[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/decks`);
        const data = response.data?.$values ?? response.data;
        return Array.isArray(data) ? data : []; 
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
        return response.data?.$values ?? response.data;
    },

    // 6. Lấy thông tin chi tiết của một thẻ học
    getDetails: async (itemId: string): Promise<any> => {
        const response = await axiosInstance.get(`${BASE_PATH}/details/${itemId}`);
        return response.data;
    },

    // 7. Tạo bộ thẻ thủ công
    createDeck: async (model: CreateDeckDto): Promise<UserDeckDTO[]> => {
        const response = await axiosInstance.post(`${BASE_PATH}/decks`, model);
        return response.data?.$values ?? response.data;
    },

    // 8. Lấy danh sách thực thể có sẵn để thêm vào deck
    getAvailableEntities: async (levelId: string, type: SkillType): Promise<any[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/available-entities`, {
            params: { levelId, type }
        });
        return response.data?.$values ?? response.data;
    },

    getReviewsByDeck: async (deckId: string): Promise<FlashcardReviewDTO[]> => {
        const response = await axiosInstance.get(`${BASE_PATH}/review/${deckId}`);
        const data = response.data?.$values ?? response.data;
        return Array.isArray(data) ? data : [];
    },
};
