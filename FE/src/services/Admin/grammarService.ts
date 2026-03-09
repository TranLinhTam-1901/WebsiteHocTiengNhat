import axiosInstance from "../../utils/axiosInstance";
import { GrammarItem, CreateUpdateGrammarDTO } from "../../interfaces/Admin/Grammar";

export const grammarService = {
  // 1. Lấy danh sách hiển thị ở Table (Get-all)
  getAll: async (): Promise<GrammarItem[]> => {
    const response = await axiosInstance.get("admin/grammar/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết để sửa (Trả về DTO đầy đủ kèm examples)
  getById: async (id: string): Promise<CreateUpdateGrammarDTO> => {
    const response = await axiosInstance.get(`admin/grammar/get-by-id/${id}`);
    return response.data;
  },

  // 3. Tạo mới
  create: async (data: CreateUpdateGrammarDTO): Promise<any> => {
    const response = await axiosInstance.post("admin/grammar/create", data);
    return response.data;
  },

  // 4. Cập nhật
  update: async (id: string, data: CreateUpdateGrammarDTO): Promise<any> => {
    const response = await axiosInstance.put(`admin/grammar/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa
  delete: async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`admin/grammar/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers (Đã sửa lại đúng route của Grammar) ---
  getLevels: async () => {
    const response = await axiosInstance.get("admin/grammar/metadata/levels");
    return response.data;
  },

  getTopics: async () => {
    const response = await axiosInstance.get("admin/grammar/metadata/topics");
    return response.data;
  },

  getLessons: async () => {
    const response = await axiosInstance.get("admin/grammar/metadata/lessons");
    return response.data;
  }
};