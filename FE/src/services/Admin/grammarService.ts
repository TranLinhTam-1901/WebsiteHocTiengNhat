import axiosInstance from "../../utils/axiosInstance";
import { GrammarItem, CreateUpdateGrammarDTO } from "../../interfaces/Admin/Grammar";

export const grammarService = {
  // 1. Lấy danh sách hiển thị ở Table
  getAll: async (): Promise<GrammarItem[]> => {
    const response = await axiosInstance.get("admin/grammar/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết để sửa
  getById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`admin/grammar/get-by-id/${id}`);
    return response.data;
  },

  // 3. Tạo mới
  create: async (data: CreateUpdateGrammarDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/grammar/create", data);
    return response.data;
  },

  // 4. Cập nhật
  update: async (id: string, data: CreateUpdateGrammarDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/grammar/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/grammar/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers (Dùng cho các Dropdown/Select trong Form) ---
  
  getLevels: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/grammar/metadata/levels");
    return response.data;
  },

  getTopics: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/grammar/metadata/topics");
    return response.data;
  },

  getLessons: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/grammar/metadata/lessons");
    return response.data;
  },

  getGrammarGroups: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/grammar/metadata/grammar-groups");
    return response.data;
  }
};