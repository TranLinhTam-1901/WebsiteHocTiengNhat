export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  levelId: string; // Bắt buộc: Học viên phải chọn mục tiêu khi đăng ký
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
  /** Cùng giá trị cho mọi tab một trình duyệt; khác trình duyệt khác. */
  browserSessionId: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string; 
  levelId?: string; // Trả về để React biết user này đang học N mấy
  roles: string[];
}

export interface Role {
  name: string;
}

export interface JLPTLevel {
  id: string;
  name: string;
}