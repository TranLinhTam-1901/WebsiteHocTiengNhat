import React, { useState } from 'react';
import { logout } from '../../../store/auth.slice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Trạng thái đóng/mở menu Nội dung
  const [isContentOpen, setIsContentOpen] = useState(location.pathname.includes('/admin/content'));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-[#f4f0f2] shrink-0 h-screen">
      <div className="p-6 flex flex-col gap-8 h-full">
        
        {/* Logo */}
        <div className="flex gap-3 items-center cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
          <div className="bg-primary rounded-full size-10 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold leading-none">JQuiz Admin</h1>
            <p className="text-[#886373] text-xs font-normal">Bảng điều khiển</p>
          </div>
        </div>

        {/* Điều hướng - Nav Links */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
          <NavItem 
            to="/admin/dashboard" 
            icon="dashboard" 
            label="Tổng quan" 
            active={location.pathname === '/admin/dashboard'} 
          />

          {/* Menu đa cấp: Nội dung */}
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setIsContentOpen(!isContentOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors w-full ${
                location.pathname.includes('/admin/content') ? 'bg-primary/10 text-primary' : 'text-[#886373] hover:bg-[#f4f0f2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={location.pathname.includes('/admin/content') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  layers
                </span>
                <span className="text-sm font-bold">Nội dung học</span>
              </div>
              <span className={`material-symbols-outlined text-sm transition-transform ${isContentOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {isContentOpen && (
              <div className="pl-12 flex flex-col gap-1 mt-1 transition-all">
                <SubNavItem to="/admin/resource/topic" label="Chủ đề" active={location.pathname === '/admin/content/topic'} />
                <SubNavItem to="/admin/resource/grammar-group" label="Nhóm ngữ pháp" active={location.pathname === '/admin/content/grammar-group'} />
                <SubNavItem to="/admin/resource/grammar" label="Ngữ pháp" active={location.pathname === '/admin/content/grammar'} />
                <SubNavItem to="/admin/resource/kanji" label="Kanji" active={location.pathname === '/admin/content/kanji'} />
                <SubNavItem to="/admin/resource/vocabulary" label="Từ vựng" active={location.pathname === '/admin/content/vocabulary'} />
                <SubNavItem to="/admin/resource/reading" label="Luyện đọc" active={location.pathname === '/admin/content/reading'} />
                <SubNavItem to="/admin/resource/listening" label="Luyện nghe" active={location.pathname === '/admin/content/listening'} />
              </div>
            )}
          </div>

          <NavItem to="/admin/question-bank" icon="add_box" label="Ngân hàng câu hỏi" active={location.pathname.includes('/admin/question-bank')} />
          <NavItem to="/admin/learners" icon="group" label="Người dùng" active={location.pathname === '/admin/learners'} />
          <NavItem to="/admin/exams" icon="assignment" label="Kho đề thi và kiểm tra" active={location.pathname === '/admin/exams'} />

          <div className="my-4 border-t border-[#f4f0f2]"></div>
          
          {/* <NavItem icon="neurology" label="Cài đặt AI" to="/admin/ai-settings" active={location.pathname === '/admin/ai-settings'} /> */}
        </nav>

        {/* Thông tin User & Đăng xuất */}
        <div className="mt-auto">
          <div className="bg-[#f4f0f2] p-4 rounded-xl flex items-center justify-between gap-1 group">
            {/* Cụm Avatar & Text */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="size-9 shrink-0 rounded-full bg-slate-300 flex items-center justify-center font-bold text-primary border-2 border-primary">
                AD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-[#181114]">Quản trị viên</p>
                <p className="text-[10px] text-[#886373] truncate">admin@jquiz.vn</p>
              </div>
            </div>

            {/* Nút Đăng xuất dạng Icon */}
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg text-red-500 hover:bg-white transition-all duration-200 flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Component NavItem chính
const NavItem = ({ to = "#", icon, label, active = false }: { to?: string, icon: string, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      active 
      ? 'bg-primary/10 text-primary font-bold' 
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

// Component SubNavItem cho menu con
const SubNavItem = ({ to, label, active }: { to: string, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`py-2 text-sm transition-colors ${
      active ? 'text-primary font-bold' : 'text-[#886373] hover:text-primary'
    }`}
  >
    {label}
  </Link>
);

export default Sidebar;