import axiosInstance from "../../utils/axiosInstance";
import { CourseDTO, CreateUpdateCourseDTO, CourseMetadataItem } from "../../interfaces/Admin/Course";

export const courseService = {
  // 1. Lấy danh sách tất cả khóa học
  getAll: async (): Promise<CourseDTO[]> => {
    const response = await axiosInstance.get("admin/courses/get-all");
    return response.data.data;
  },

  // 2. Lấy chi tiết khóa học (để sửa)
  getById: async (id: string): Promise<CourseDTO> => {
    const response = await axiosInstance.get(`admin/courses/get-by-id/${id}`);
    return response.data.data;
  },

  // 3. Thêm mới khóa học
  create: async (data: CreateUpdateCourseDTO): Promise<{ message: string; id: string }> => {
    const response = await axiosInstance.post("admin/courses/create", data);
    return response.data;
  },

  // 4. Cập nhật khóa học
  update: async (id: string, data: CreateUpdateCourseDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.put(`admin/courses/update/${id}`, data);
    return response.data;
  },

  // 5. Xóa khóa học
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`admin/courses/delete/${id}`);
    return response.data;
  },

  // --- Metadata Helpers ---
  
  // Lấy danh sách khóa học cho dropdown
  getMetadata: async (): Promise<CourseMetadataItem[]> => {
    const response = await axiosInstance.get("admin/courses/metadata");
    return response.data;
  },

  // Lấy danh sách cấp độ
  getLevels: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get("admin/courses/metadata/levels");
    return response.data.data;
  }
};
