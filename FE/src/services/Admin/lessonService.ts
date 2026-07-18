import axiosInstance from "../../utils/axiosInstance";
import { LessonDTO, CreateUpdateLessonDTO, LessonMetadataItem, SkillType } from "../../interfaces/Admin/Lesson";

export const lessonService = {
  // 1. Lấy danh sách tất cả bài học
  getAll: async (): Promise<LessonDTO[]> => {
    const response = await axiosInstance.get("admin/lessons/get-all");
    return response.data.data;
  },

  // 2. Lấy bài học theo khóa học
  getByCourse: async (courseId: string): Promise<LessonDTO[]> => {
    const response = await axiosInstance.get(`admin/lessons/get-by-course/${courseId}`);
    return response.data;
  },

  // 3. Lấy chi tiết bài học (để sửa)
  getById: async (id: string): Promise<LessonDTO> => {
    const response = await axiosInstance.get(`admin/lessons/get-by-id/${id}`);
    return response.data.data;
  },

  // 4. Thêm mới bài học
  create: async (data: CreateUpdateLessonDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/lessons/create", data);
    return response.data;
  },

  // 5. Cập nhật bài học
  update: async (id: string, data: CreateUpdateLessonDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/lessons/update/${id}`, data);
    return response.data;
  },

  // 6. Xóa bài học
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/lessons/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  
  // Lấy danh sách bài học cho dropdown
  getMetadata: async (): Promise<LessonMetadataItem[]> => {
    const response = await axiosInstance.get("admin/lessons/metadata");
    return response.data;
  },

  // Lấy danh sách loại kỹ năng
  getSkillTypes: async (): Promise<SkillType[]> => {
    const response = await axiosInstance.get("admin/lessons/skill-types");
    return response.data;
  },

  // Lấy danh sách khóa học
  getCourses: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get("admin/lessons/metadata/courses");
    return response.data.data;
  }
};
