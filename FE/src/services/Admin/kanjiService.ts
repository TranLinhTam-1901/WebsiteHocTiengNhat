import axiosInstance from "../../utils/axiosInstance";
import { KanjiItem, CreateUpdateKanjiDTO } from "../../interfaces/Admin/Kanji";

export const kanjiService = {
  // 1. Lấy danh sách Kanji cho bảng (Table)
  getAll: async (): Promise<KanjiItem[]> => {
    const response = await axiosInstance.get("admin/kanji/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết để đổ vào Form Edit (Map đúng các trường từ Controller)
  getById: async (id: string): Promise<CreateUpdateKanjiDTO> => {
    const response = await axiosInstance.get(`admin/kanji/get-by-id/${id}`);
    return response.data;
  },

  // 3. THÊM MỚI
  create: async (data: CreateUpdateKanjiDTO): Promise<any> => {
    const response = await axiosInstance.post("admin/kanji/create", data);
    return response.data;
  },

  // 4. CẬP NHẬT
  update: async (id: string, data: CreateUpdateKanjiDTO): Promise<any> => {
    const response = await axiosInstance.put(`admin/kanji/update/${id}`, data);
    return response.data;
  },

  // 5. XÓA
  delete: (id: string) => 
    axiosInstance.delete(`admin/kanji/delete/${id}`),

  // --- Metadata Helpers (Đã sửa đường dẫn trỏ về đúng KanjiAdminController) ---
  getLevels: async () => {
    const response = await axiosInstance.get("admin/kanji/metadata/levels");
    return response.data;
  },

  getTopics: async () => {
    const response = await axiosInstance.get("admin/kanji/metadata/topics");
    return response.data;
  },

  getLessons: async () => {
    const response = await axiosInstance.get("admin/kanji/metadata/lessons");
    return response.data;
  }
};