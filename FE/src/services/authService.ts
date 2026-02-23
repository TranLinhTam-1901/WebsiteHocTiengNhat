import axios from '../utils/axiosInstance';
import { RegisterPayload, LoginPayload, AuthResponse } from '../interfaces/auth';

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
};
