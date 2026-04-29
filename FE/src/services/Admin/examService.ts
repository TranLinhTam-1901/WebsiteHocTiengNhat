import axiosInstance from "../../utils/axiosInstance";
import { 
    GenerateExamRequest, 
    ExamSummaryResponse, 
    ExamPartConfig,
    ExamDetailResponse,
    ExamListResponse,UpdateExamRequest,CourseLookupResponse, LessonFilterResponse
} from '../../interfaces/Admin/Exam';

const ExamService = {

    // 1. Lấy cấu trúc đề thi chuẩn (Template) theo Level N1-N3
    getStandardTemplate: async (levelId: string): Promise<any> => {
        const response = await axiosInstance.get(`/admin/exams/templates/standards/${levelId}`);
        return response.data;
    },

    // 2. Lấy danh sách các kỹ năng (dùng cho Dropdown cấu hình phần thi)
    getSkillsLookup: async () => {
        const response = await axiosInstance.get(`/admin/exams/skills`);
        return response.data;
    },

    // 3. Lấy danh sách bài học để chọn khi làm đề "Luyện tập theo bài học"
    getLessonsLookup: async () => {
        const response = await axiosInstance.get(`/admin/exams/lessons`);
        return response.data;
    },

    // 4. Tính toán tóm tắt (Tổng câu, Tổng điểm) dựa trên cấu hình hiện tại
    getExamSummary: async (parts: ExamPartConfig[]): Promise<ExamSummaryResponse> => {
        const response = await axiosInstance.post(`/admin/exams/summary`, parts);
        return response.data;
    },

    // 5. API chính: Tạo/Đúc đề thi ngẫu nhiên
    generateExam: async (data: GenerateExamRequest): Promise<{ success: boolean, examId: string }> => {
        const response = await axiosInstance.post(`/admin/exams/generate`, data);
        return response.data;
    },
    // 6. Lấy danh sách Level thực tế từ Database
    getLevelsLookup: async (): Promise<{ levelID: string, levelName: string }[]> => {
        const response = await axiosInstance.get(`/admin/exams/levels`);
        return response.data;
    },

    // async getLessonsByLevel(levelId: string): Promise<any[]> {
    // const response = await axiosInstance.get(`/admin/exams/lessons-by-level/${levelId}`);
    // return response.data;
    // },
    getCoursesByLevel: async (levelId: string): Promise<CourseLookupResponse[]> => {
        const response = await axiosInstance.get(`/admin/exams/courses-by-level/${levelId}`);
        return response.data;
    },

    // 2. Lấy danh sách bài học có kèm lọc theo Course (CẬP NHẬT)
    // Sử dụng Query Params để khớp với [FromQuery] ở Backend
    getLessonsByFilter: async (levelId: string, courseId?: string | null): Promise<LessonFilterResponse[]> => {
        const response = await axiosInstance.get(`/admin/exams/lessons-filter`, {
            params: {
                levelId: levelId,
                courseId: courseId || undefined // Nếu null/undefined thì không gửi param này
            }
        });
        return response.data;
    },
    async getStatsBySkill(levelId: string): Promise<any[]> {
        const response = await axiosInstance.get(`/admin/exams/stats-by-skill/${levelId}`);
        return response.data;
    },

    // Lấy danh sách đề thi với các bộ lọc
    async getExams(search?: string, levelId?: string, type?: number): Promise<ExamListResponse[]> {
        const response = await axiosInstance.get('/admin/exams', {
            params: {
                search: search || undefined,
                levelId: levelId || undefined,
                type: type !== undefined ? type : undefined
            }
        });
        return response.data;
    },

    // Lấy chi tiết một đề thi theo ID
    async getExamDetails(id: string): Promise<ExamDetailResponse> {
        const response = await axiosInstance.get(`/admin/exams/${id}/details`);
        return response.data;
    },

    // 3. Đóng/Mở trạng thái công khai 
    async togglePublish(id: string): Promise<{ success: boolean; isPublished: boolean; message: string }> {
        const response = await axiosInstance.patch(`/admin/exams/${id}/publish`);
        return response.data;
    },

    updateExam: async (id: string, data: UpdateExamRequest): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put(`/admin/exams/${id}`, data);
        return response.data;
    },
    
};

export default ExamService;