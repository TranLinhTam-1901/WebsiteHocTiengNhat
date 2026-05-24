import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface PrivateRouteProps {
  children?: React.ReactElement;
  role?: string | string[];
}

const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { token, roles } = useSelector((state: any) => state.auth);

  // 1. Kiểm tra Token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra Quyền (Role)
  // Xử lý trường hợp role là mảng hoặc string đơn lẻ
  const hasRequiredRole = Array.isArray(role) 
    ? role.some(r => roles.includes(r)) 
    : !role || roles.includes(role);

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Trả về Outlet nếu mọi thứ ổn
  return <Outlet />;
};

export default PrivateRoute;