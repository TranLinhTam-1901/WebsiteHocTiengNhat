import axiosInstance from "../../utils/axiosInstance";
import { CreateQuestionDTO, QuestionDetail, QuestionListItem, SourceMaterial } from '../../interfaces/Admin/QuestionBank';
import axios from "axios";
import { TopicItem } from "@/interfaces/Admin/Topic";

const QuestionService = {
    
    // Lấy phôi từ Task 1 (Vocab, Grammar, Kanji...)
    getSourceMaterials: async (lessonId: string, type: string,levelName?: string): Promise<SourceMaterial[]> => {
        const response = await axiosInstance.get(`/admin/question-bank/source-materials`, {
            params: { lessonId: lessonId === "" ? undefined : lessonId, type,levelName: levelName === "" ? undefined : levelName }
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

    getTopicsLookup: async () => {
        const response = await axiosInstance.get("/admin/question-bank/metadata/topics");
        return response.data;
    },

    // Lấy danh sách 
    getQuestions: async (filters: { 
        lessonId?: string, 
        topicId?: string, 
        difficulty?: number, 
        type?: number, 
        searchTerm?: string 
    }): Promise<QuestionListItem[]> => {
        const response = await axiosInstance.get(`/admin/question-bank`, {
            params: {
                lessonId: filters.lessonId === "" ? undefined : filters.lessonId,
                topicId: filters.topicId === "" ? undefined : filters.topicId,
                difficulty: filters.difficulty,
                type: filters.type,
                searchTerm: filters.searchTerm
            }
        });
        return response.data;
    },


    // Lấy chi tiết để Edit (Sử dụng QuestionDetail)
    getQuestionDetail: async (id: string): Promise<QuestionDetail> => {
        const response = await axiosInstance.get(`/admin/question-bank/${id}`);
        return response.data;
    },

    //  Cập nhật câu hỏi
    updateQuestion: async (id: string, data: QuestionDetail): Promise<any> => {
        const response = await axiosInstance.put(`/admin/question-bank/${id}`, data);
        return response.data;
    },

    // Cập nhật trạng thái nhanh (Toggle Publish/Draft)
    updateStatus: async (id: string, status: number): Promise<any> => {
        const response = await axiosInstance.patch(`/admin/question-bank/${id}/status`, status, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    // Lấy các liên kết cho Modal Icon Xích
    getQuestionLinks: async (id: string): Promise<any[]> => {
        const response = await axiosInstance.get(`/admin/question-bank/${id}/links`);
        return response.data;
    }
    
};

export default QuestionService;