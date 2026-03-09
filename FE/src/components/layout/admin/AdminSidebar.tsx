import React from 'react';
import { logout } from '../../../store/auth.slice';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Thêm Link và useLocation
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để kiểm tra trang nào đang active

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-[#f4f0f2] shrink-0">
      <div className="p-6 flex flex-col gap-8 h-full">
        {/* Logo */}
        <div className="flex gap-3 items-center">
          <div className="bg-primary rounded-full size-10 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold leading-none">JQuiz Admin</h1>
            <p className="text-[#886373] text-xs font-normal">Bảng điều khiển</p>
          </div>
        </div>

        {/* Điều hướng - Nav Links */}
        <nav className="flex flex-col gap-1 flex-1">
          {/* Dẫn link về /admin/dashboard */}
          <NavItem 
            to="/admin/dashboard" 
            icon="dashboard" 
            label="Tổng quan" 
            active={location.pathname === '/admin/dashboard'} 
          />
          
          <NavItem icon="layers" label="Nội dung" />
          <NavItem icon="quiz" label="Câu hỏi" />
          <NavItem icon="assignment" label="Kỳ thi" />

          {/* DẪN LINK VÀO ĐÂY: Quản lý người dùng */}
          <NavItem 
            to="/admin/learners" 
            icon="group" 
            label="Người dùng" 
            active={location.pathname === '/admin/learners'} 
          />
          <NavItem 
            to="/admin/question-bank/create" 
            icon="add_box" // Hoặc dùng icon "quiz" tùy bạn
            label="Tạo câu hỏi" 
            active={location.pathname === '/admin/question-bank/create'} 
          />
          <div className="my-4 border-t border-[#f4f0f2]"></div>
          <NavItem icon="neurology" label="Cài đặt AI" />
        </nav>

        {/* Thông tin User */}
        <div className="mt-auto">
          <div className="bg-[#f4f0f2] p-4 rounded-xl flex items-center gap-3 mb-4">
            <div className="size-9 rounded-full bg-slate-300 flex items-center justify-center font-bold text-primary border-2 border-primary">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">Quản trị viên</p>
              <p className="text-[10px] text-[#886373] truncate">admin@jquiz.vn</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

// Component con NavItem được nâng cấp để dùng Link
const NavItem = ({ to = "#", icon, label, active = false }: { to?: string, icon: string, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      active 
      ? 'bg-primary/10 text-primary' 
      : 'text-[#886373] hover:bg-[#f4f0f2]'
    }`}
  >
    <span 
      className="material-symbols-outlined" 
      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
    >
      {icon}
    </span>
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

export default Sidebar;