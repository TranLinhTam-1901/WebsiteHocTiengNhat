import axiosInstance from '../utils/axiosInstance';

export interface CoursePublic {
  courseID: string;
  courseName: string;
  description?: string;
  levelID: string;
  levelName: string;
  lessonCount: number;
}

export interface CourseDetailPublic extends CoursePublic {
  lessons: Array<{
    lessonID: string;
    title: string;
    sortOrder: number;
  }>;
}

class CourseService {
  /**
   * Lấy tất cả khóa học (không cần login)
   */
  async getAllCoursesPublic(): Promise<CoursePublic[]> {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: CoursePublic[];
      }>('/public/courses/get-all');
      return response.data.data || [];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách khóa học:', error);
      throw error;
    }
  }

  /**
   * Lấy khóa học theo level (không cần login)
   */
  async getCoursesByLevelPublic(levelId: string): Promise<CoursePublic[]> {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: CoursePublic[];
      }>(`/public/courses/level/${levelId}`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Lỗi khi lấy khóa học cấp ${levelId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một khóa học (không cần login)
   */
  async getCourseDetailPublic(courseId: string): Promise<CourseDetailPublic> {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: CourseDetailPublic;
      }>(`/public/courses/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết khóa học ${courseId}:`, error);
      throw error;
    }
  }
}

export default new CourseService();
