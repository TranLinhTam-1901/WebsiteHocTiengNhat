import axiosInstance from "../../utils/axiosInstance";
import { VocabularyItem, CreateUpdateVocabDTO } from "../../interfaces/Admin/Vocabulary";

export const vocabService = {
  // 1. Lấy danh sách tất cả (Khớp với [HttpGet("get-all")])
  getAll: async (): Promise<VocabularyItem[]> => {
    const response = await axiosInstance.get("admin/vocabulary/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết để sửa (Khớp với [HttpGet("get-by-id/{id}")])
  // Lưu ý: Response từ Backend trả về object có cấu trúc khớp với VocabularyItem
  getById: async (id: string): Promise<VocabularyItem> => {
    const response = await axiosInstance.get(`admin/vocabulary/get-by-id/${id}`);
    return response.data;
  },

  // 3. THÊM MỚI (Khớp với [HttpPost("create")])
  create: async (data: CreateUpdateVocabDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/vocabulary/create", data);
    return response.data;
  },

  // 4. CẬP NHẬT (Khớp với [HttpPut("update/{id}")])
  update: async (id: string, data: CreateUpdateVocabDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/vocabulary/update/${id}`, data);
    return response.data;
  },

  // 5. XÓA (Khớp với [HttpDelete("delete/{id}")])
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/vocabulary/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  
  getLevels: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get("admin/vocabulary/metadata/levels");
    return response.data;
  },

  getTopics: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get("admin/vocabulary/metadata/topics");
    return response.data;
  },

  getLessons: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get("admin/vocabulary/metadata/lessons");
    return response.data;
  }
};