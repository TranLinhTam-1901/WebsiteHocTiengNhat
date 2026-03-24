import axiosInstance from "../../utils/axiosInstance";
import { TopicItem, CreateUpdateTopicDTO } from "../../interfaces/Admin/Topic";

export const topicService = {
  // 1. Lấy danh sách tất cả các chủ đề (Full data cho bảng quản lý)
  getAll: async (): Promise<TopicItem[]> => {
    const response = await axiosInstance.get("admin/topic/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết một chủ đề theo ID
  getById: async (id: string): Promise<TopicItem> => {
    const response = await axiosInstance.get(`admin/topic/get-by-id/${id}`);
    return response.data;
  },

  // 3. Tạo chủ đề mới
  create: async (data: CreateUpdateTopicDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/topic/create", data);
    return response.data;
  },

  // 4. Cập nhật chủ đề
  update: async (id: string, data: CreateUpdateTopicDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/topic/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa chủ đề
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/topic/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  // Dùng cho các dropdown hoặc multi-select ở các màn hình khác (như Listening/Vocab)
  getMetadata: async (): Promise<{ topicID: string; topicName: string }[]> => {
    const response = await axiosInstance.get("admin/topic/metadata");
    return response.data;
  }
};