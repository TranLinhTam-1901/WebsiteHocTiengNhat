import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface PrivateRouteProps {
  children?: React.ReactElement;
  role?: string | string[];
}

const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { token, roles } = useSelector((state: any) => state.auth);

  // 1. Chỉ log khi Token hoặc Role thực sự thay đổi để tránh rác console
  useEffect(() => {
    console.log("----- PRIVATE ROUTE CHECK -----");
    console.log("Required role:", role);
    console.log("User roles:", roles);
    console.log("Token exists:", !!token);
    
    if (token && role && roles.includes(role)) {
      console.log("✅ Access granted");
    }
  }, [token, roles, role]);

  // 2. Kiểm tra Token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Kiểm tra Quyền (Role)
  // Xử lý trường hợp role là mảng hoặc string đơn lẻ
  const hasRequiredRole = Array.isArray(role) 
    ? role.some(r => roles.includes(r)) 
    : !role || roles.includes(role);

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Trả về Outlet nếu mọi thứ ổn
  return <Outlet />;
};

export default PrivateRoute;