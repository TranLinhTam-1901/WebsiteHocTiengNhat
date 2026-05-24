import axiosInstance from "../../utils/axiosInstance";
import { KanjiItem, CreateUpdateKanjiDTO } from "../../interfaces/Admin/Kanji";

// Interface bổ trợ cho Metadata
export interface RadicalMetadata {
  id: string;
  name: string;
  character: string;
  stroke: number;
}

export interface GenericMetadata {
  id: string;
  name: string;
}

export const kanjiService = {
  // 1. Lấy danh sách Kanji cho bảng (Table)
  getAll: async (): Promise<KanjiItem[]> => {
    const response = await axiosInstance.get("admin/kanji/get-all");
    return response.data;
  },

  // 2. Lấy chi tiết để đổ vào Form Edit 
  getById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`admin/kanji/get-by-id/${id}`);
    return response.data;
  },

  // 3. THÊM MỚI
  create: async (data: CreateUpdateKanjiDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/kanji/create", data);
    return response.data;
  },

  // 4. CẬP NHẬT
  update: async (id: string, data: CreateUpdateKanjiDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/kanji/update/${id}`, data);
    return response.data;
  },

  // 5. XÓA
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/kanji/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---

  getRadicals: async (): Promise<RadicalMetadata[]> => {
    const response = await axiosInstance.get("admin/kanji/metadata/radicals");
    return response.data;
  },

  getLevels: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/kanji/metadata/levels");
    return response.data;
  },

  getTopics: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/kanji/metadata/topics");
    return response.data;
  },

  getLessons: async (): Promise<{ id: string, name: string }[]> => {
    const response = await axiosInstance.get("admin/kanji/metadata/lessons");
    return response.data;
  }
};