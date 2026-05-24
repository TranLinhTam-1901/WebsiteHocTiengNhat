import axiosInstance from "../../utils/axiosInstance";
import { ReadingItem, CreateUpdateReadingDTO } from "../../interfaces/Admin/Reading";

export const readingService = {
  // 1. Lấy danh sách bài đọc cho bảng
  getAll: async (): Promise<ReadingItem[]> => {
    const response = await axiosInstance.get("admin/reading/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết bài đọc
  getById: async (id: string): Promise<CreateUpdateReadingDTO> => {
    const response = await axiosInstance.get(`admin/reading/get-by-id/${id}`);
    return response.data;
  },

  // 3. Tạo bài đọc mới
  create: async (data: CreateUpdateReadingDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/reading/create", data);
    return response.data;
  },

  // 4. Cập nhật bài đọc
  update: async (id: string, data: CreateUpdateReadingDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/reading/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa bài đọc
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/reading/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  getLevels: async () => {
    const response = await axiosInstance.get("admin/reading/metadata/levels");
    return response.data;
  },

  getTopics: async () => {
    const response = await axiosInstance.get("admin/reading/metadata/topics");
    return response.data;
  },

  getLessons: async () => {
    const response = await axiosInstance.get("admin/reading/metadata/lessons");
    return response.data;
  }
};