import axiosInstance from "../../utils/axiosInstance";
import { User, UpdateRoleRequest } from "../../interfaces/User";
import { ProgressDetailResponse } from '../../interfaces/Admin/ProgressDetail';

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
    const response = await axiosInstance.get<ProgressDetailResponse>(
      `/admin/management/learner-progress/${learnerId}`
    );
    return response.data;
  }

};

export default adminService;