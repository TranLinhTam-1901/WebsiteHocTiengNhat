import axiosInstance from "../../utils/axiosInstance";
import { CreateQuestionDTO, SourceMaterial, Topics } from '../../interfaces/Admin/QuestionBank';
import axios from "axios";

const QuestionService = {
    // Lấy phôi từ Task 1 (Vocab, Grammar, Kanji...)
    getSourceMaterials: async (lessonId: string, type: string): Promise<SourceMaterial[]> => {
        const response = await axiosInstance.get(`/admin/question-bank/source-materials`, {
            params: { lessonId: lessonId === "" ? undefined : lessonId, type }
        });
        return response.data;
    },

    // Lấy danh sách Topics để chọn nhãn
    getTopics: async () => {
        const response = await axiosInstance.get(`/admin/question-bank/topics`);
        return response.data;
    },

    // Tìm kiếm câu hỏi tương đương
    searchEquivalent: async (query: string) => {
        const response = await axiosInstance.get(`/admin/question-bank/search-equivalent`, {
            params: { query }
        });
        return response.data;
    },

    // Tạo câu hỏi mới
    createQuestion: async (data: CreateQuestionDTO) => {
        const response = await axiosInstance.post(`/admin/question-bank/create`, data);
        return response.data;
    },
    // Thêm hàm lấy danh sách bài học để chọn trong View 2 độc lập
    getLessonsLookup: async () => {
        const response = await axiosInstance.get(`/admin/question-bank/lessons-lookup`);
        return response.data;
    },

    getTopicsLookup: async (): Promise<Topics[]> => {
        const response = await axiosInstance.get('/admin/question-bank/topics');
        return response.data;
    }
};

export default QuestionService;