export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isLocked: boolean; 
}

export interface UpdateRoleRequest {
  userId: string;
  newRole: string;
}