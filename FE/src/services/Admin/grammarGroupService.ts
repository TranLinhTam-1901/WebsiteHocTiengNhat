import axiosInstance from "../../utils/axiosInstance";
import { GrammarGroupItem, CreateUpdateGrammarGroupDTO } from "../../interfaces/Admin/GrammarGroup";

export const grammarGroupService = {
  // 1. Lấy danh sách tất cả các nhóm ngữ pháp (Full data cho bảng quản lý)
  getAll: async (): Promise<GrammarGroupItem[]> => {
    const response = await axiosInstance.get("admin/grammar-group/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết một nhóm ngữ pháp theo ID
  getById: async (id: string): Promise<GrammarGroupItem> => {
    const response = await axiosInstance.get(`admin/grammar-group/get-by-id/${id}`);
    return response.data;
  },

  // 3. Tạo nhóm ngữ pháp mới
  create: async (data: CreateUpdateGrammarGroupDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/grammar-group/create", data);
    return response.data;
  },

  // 4. Cập nhật nhóm ngữ pháp
  update: async (id: string, data: CreateUpdateGrammarGroupDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/grammar-group/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa nhóm ngữ pháp
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/grammar-group/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  // Dùng cho các dropdown hoặc multi-select ở màn hình quản lý bài ngữ pháp (Grammar Admin)
  getMetadata: async (): Promise<{ grammarGroupID: string; groupName: string }[]> => {
    const response = await axiosInstance.get("admin/grammar-group/metadata");
    return response.data;
  }
};