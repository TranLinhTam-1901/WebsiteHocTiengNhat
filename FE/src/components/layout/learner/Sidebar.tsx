import React from 'react';
import { logout } from '../../../store/auth.slice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
    const handleLogout = () => {
      dispatch(logout());
      navigate('/login', { replace: true });
    };
  return (
    <aside className="w-64 flex flex-col justify-between bg-white border-r border-[#f4f0f2] p-4 shrink-0">
      <div className="flex flex-col gap-8">
        <div className="flex gap-3 items-center px-2">
          <div className="bg-[#f287ae]/20 rounded-full size-10 flex items-center justify-center text-[#f287ae] font-bold">J</div>
          <div className="flex flex-col">
            <h1 className="text-[#181114] text-lg font-bold leading-none">JQuiz</h1>
            <p className="text-[#886373] text-xs font-normal">JLPT AI Tutor</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            { icon: 'dashboard', label: 'Dashboard', to: '/learner/dashboard' as const },
            { icon: 'map', label: 'Roadmap', to: '/learner/roadmap' as const },
            { icon: 'book_4', label: 'Study', to: '/learner/study/reviews' as const },
            { icon: 'edit_note', label: 'Practice', to: '/learner/quiz/practice' as const },
            { icon: 'history', label: 'History', to: '/learner/history' as const },
            { icon: 'support_agent', label: 'Hỗ trợ', to: '/learner/support' as const },
          ].map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full cursor-pointer transition-colors ${
                active ? 'bg-[#f287ae]/10 text-[#f287ae]' : 'text-[#181114] hover:bg-zinc-100'
              }`}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>{item.icon}</span>
              <p className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</p>
            </Link>
            );
          })}
        </nav>
      </div>
      <div className="bg-[#f287ae]/5 p-4 rounded-xl border border-[#f287ae]/20">
        <p className="text-[10px] font-bold text-[#f287ae] mb-1 uppercase tracking-widest">Mastery Level</p>
        <p className="text-sm font-semibold text-[#181114] mb-2">Intermediate (N3)</p>
        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#f287ae] h-full w-[45%]"></div>
        </div>
      </div>

       {/* Logout Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;