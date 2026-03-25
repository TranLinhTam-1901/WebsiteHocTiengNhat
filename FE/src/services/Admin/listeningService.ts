import axiosInstance from "../../utils/axiosInstance";
import { ListeningItem, CreateUpdateListeningDTO } from "../../interfaces/Admin/Listening";

export const listeningService = {
  // 1. Lấy danh sách bài nghe
  getAll: async (): Promise<ListeningItem[]> => {
    const response = await axiosInstance.get("admin/listening/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết bài nghe kèm câu hỏi & đáp án
  getById: async (id: string): Promise<CreateUpdateListeningDTO> => {
    const response = await axiosInstance.get(`admin/listening/get-by-id/${id}`);
    return response.data;
  },

  // 3. Tạo bài nghe mới
  create: async (data: CreateUpdateListeningDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/listening/create", data);
    return response.data;
  },

  // 4. Cập nhật bài nghe
  update: async (id: string, data: CreateUpdateListeningDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/listening/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa bài nghe
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/listening/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  // Lưu ý: Tận dụng chung metadata từ vựng hoặc đổi sang endpoint listening nếu bạn đã viết trong controller
  getLevels: async () => {
    const response = await axiosInstance.get("admin/listening/metadata/levels");
    return response.data;
  },

  getTopics: async () => {
    const response = await axiosInstance.get("admin/listening/metadata/topics");
    return response.data;
  },

  getLessons: async () => {
    const response = await axiosInstance.get("admin/listening/metadata/lessons");
    return response.data;
  }
};