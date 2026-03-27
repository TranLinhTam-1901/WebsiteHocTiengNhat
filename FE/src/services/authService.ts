import axios from '../utils/axiosInstance';
import { RegisterPayload, LoginPayload, AuthResponse, JLPTLevel } from '../interfaces/auth';

export const authService = {
  // Đăng ký tài khoản mới
  async register(payload: RegisterPayload): Promise<void> {
    await axios.post(`/auth/register`, payload);
  },

  // Đăng nhập
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`/auth/login`, payload);
    return response.data;
  },

  // Lấy danh sách trình độ JLPT để đổ vào Dropdown
  async getLevels(): Promise<JLPTLevel[]> {
    const response = await axios.get<JLPTLevel[]>(`/auth/metadata/levels`);
    return response.data;
  },
};