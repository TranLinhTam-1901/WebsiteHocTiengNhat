import axiosInstance from "../../utils/axiosInstance";
import { User, UpdateRoleRequest } from "../../interfaces/User";

const adminService = {
  // Lấy danh sách toàn bộ người dùng
  getAllUsers: () => axiosInstance.get<User[]>("admin/get-users"),

  // Thay đổi vai trò (Admin/User)
  changeRole: (data: UpdateRoleRequest) => 
    axiosInstance.post("admin/change-role", data),

  // Khóa/Mở khóa tài khoản
  toggleLock: (userId: string, isLocked: boolean) => 
    axiosInstance.post("admin/lock-user", { userId, isLocked }),

  
};

export default adminService;