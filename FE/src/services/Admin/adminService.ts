import axiosInstance from "../../utils/axiosInstance";
import { User, UpdateRoleRequest } from "../../interfaces/User";
import { DashboardProgressResponse, ProgressDetailResponse } from '../../interfaces/Admin/ProgressDetail';
import { LearnersProgressSummary } from '../../interfaces/Admin/LearnersProgressSummary';

const adminService = {
  // Lấy danh sách toàn bộ người dùng
  getAllUsers: () => axiosInstance.get<User[]>("admin/get-users"),

  // Thay đổi vai trò (Admin/User)
  changeRole: (data: UpdateRoleRequest) => 
    axiosInstance.post("admin/change-role", data),

  // Khóa/Mở khóa tài khoản
  toggleLock: (userId: string, isLocked: boolean) => 
    axiosInstance.post("admin/lock-user", { userId, isLocked }),


  getLearnerProgress: async (learnerId: string) => {
    const response = await axiosInstance.get<DashboardProgressResponse>(
      `/admin/management/learner-progress/${learnerId}`
    );
    return response.data;
  },

  getLearnersProgressSummary: async (): Promise<LearnersProgressSummary> => {
    const response = await axiosInstance.get<LearnersProgressSummary>(
      '/admin/management/learners-progress-summary'
    );
    return response.data;
  },

};

export default adminService;