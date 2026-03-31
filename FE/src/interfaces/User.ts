export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isLocked: boolean;
  
  levelId?: string;
  levelName?: string; 
  progressPercent?: number;
}

export interface UpdateRoleRequest {
  userId: string;
  newRole: string;
}

// Dùng để đổ dữ liệu vào các ô Select lọc trình độ
export interface JLPTLevel {
  id: string;
  name: string; 
}