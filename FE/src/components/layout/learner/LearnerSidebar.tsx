import React, { useState, useEffect } from 'react';
import { logout } from '../../../store/auth.slice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector} from 'react-redux';
import { AppDispatch, RootState} from '../../../store';
import { User } from '../../../interfaces/User';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { email } = useSelector((state: RootState) => state.auth);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const isSkillActive = location.pathname.includes('/learner/skill') || location.pathname.includes('/learner/flashcards');
  const [isSkillOpen, setIsSkillOpen] = useState(isSkillActive);

  const isSubItemActive = (pathSegment: string, skillEnum: number) => {
    // 1. Kiểm tra theo đường dẫn trực tiếp (trang Hub/Learning)
    if (location.pathname.includes(pathSegment)) return true;
  
    // 2. Lấy type từ Search Params (?type=...)
    const searchParams = new URLSearchParams(location.search);
    const typeParam = searchParams.get('type');
    
    // 3. Lấy type từ Navigate State (Dùng cho các trang con như Review/Detail)
    const stateType = location.state?.filterState ?? location.state?.skillType;
  
    // Kiểm tra nếu đang ở các trang Flashcard
    if (location.pathname.includes('/learner/flashcards')) {
      // Ưu tiên check theo Param trên URL trước, sau đó tới State
      const currentType = typeParam !== null ? Number(typeParam) : stateType;
      
      if (currentType !== undefined && Number(currentType) === skillEnum) {
        return true;
      }
    }
  
    return false;
  };
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await LearnerProfileService.getCurrentProfile();
        console.log("Dữ liệu Profile nhận được:", profile);
        setCurrentUser(profile);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (isSkillActive) setIsSkillOpen(true);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-[#f4f0f2] shrink-0 h-screen">
      <div className="p-6 flex flex-col gap-8 h-full">
        
        {/* Logo */}
        <div className="flex gap-3 items-center cursor-pointer" onClick={() => navigate('/learner/dashboard')}>
          <div className="bg-primary rounded-full size-10 flex items-center justify-center text-white shadow-lg shadow-primary/20 font-bold">
            J
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold leading-none text-[#181114]">JQuiz Learner</h1>
            <p className="text-[#886373] text-xs font-normal">Học tiếng Nhật cùng AI</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
          {/* --- PHẦN 1: TỔNG QUAN --- */}
          <NavItem 
            to="/learner/dashboard" 
            icon="dashboard" 
            label="Tổng quan" 
            active={location.pathname === '/learner/dashboard'} 
          />

          {/* --- PHẦN 2: LỘ TRÌNH HỌC CHÍNH --- */}
          <NavItem 
            to="/learner/roadmap" 
            icon="map" 
            label="Lộ trình Minna" 
            active={location.pathname.startsWith('/learner/roadmap') || location.pathname.startsWith('/learner/study/')} 
          />

          <NavItem 
            to="/learner/studyresource/vocabulary" 
            icon="menu_book" 
            label="Thư viện từ vựng" 
            active={location.pathname.startsWith('/learner/studyresource/vocabulary')} 
          />
          <NavItem 
            to="/learner/studyresource/kanji" 
            icon="draw" 
            label="Thư viện Kanji" 
            active={location.pathname.startsWith('/learner/studyresource/kanji')} 
          />

          {/* --- PHẦN 3: RÈN LUYỆN KỸ NĂNG --- */}
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setIsSkillOpen(!isSkillOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors w-full ${
                isSkillActive ? 'bg-primary/10 text-primary' : 'text-[#886373] hover:bg-[#f4f0f2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={isSkillActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  fitness_center
                </span>
                <span className="text-sm font-bold">Luyện kỹ năng</span>
              </div>
              <span className={`material-symbols-outlined text-sm transition-transform ${isSkillOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {isSkillOpen && (
              <div className="pl-12 flex flex-col gap-1 mt-1 transition-all">
                <SubNavItem 
                  to="/learner/skill-learning/vocabulary" 
                  label="Từ vựng" 
                  active={isSubItemActive('/skill-learning/vocabulary', SkillType.Vocabulary)} 
                />
                <SubNavItem 
                  to="/learner/skill-learning/kanji" 
                  label="Hán tự" 
                  active={isSubItemActive('/skill-learning/kanji', SkillType.Kanji)} 
                />
                <SubNavItem 
                  to="/learner/skill-learning/grammar" 
                  label="Ngữ pháp" 
                  active={isSubItemActive('/skill-learning/grammar', SkillType.Grammar)} 
                />
                <SubNavItem 
                  to="/learner/skill-learning/reading" 
                  label="Luyện đọc" 
                  active={isSubItemActive('/skill-learning/reading', SkillType.Reading)} 
                />
                <SubNavItem 
                  to="/learner/skill-learning/listening" 
                  label="Luyện nghe" 
                  active={isSubItemActive('/skill-learning/listening', SkillType.Listening)}
                />
              </div>
            )}
          </div>

          {/* --- PHẦN 4: KIỂM TRA & KẾT QUẢ --- */}
          <NavItem 
            to="/learner/exams" 
            icon="assignment" 
            label="Kho đề thi JLPT" 
            active={location.pathname.startsWith('/learner/exams')} 
          />
          <NavItem 
            to="/learner/history" 
            icon="history" 
            label="Lịch sử & Tiến độ" 
            active={location.pathname === '/learner/history'} 
          />
          <NavItem 
            to="/learner/leaderboard" 
            icon="emoji_events" 
            label="Bảng xếp hạng" 
            active={location.pathname === '/learner/leaderboard'} 
          />

          <NavItem 
            to="/learner/support" 
            icon="chat" 
            label="Chat hỗ trợ" 
            active={location.pathname === '/learner/support'} 
          />

          <div className="my-4 border-t border-[#f4f0f2]"></div>
        </nav>

        {/* Tiến độ */}
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
          <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">Tiến độ học tập</p>
          <p className="text-sm font-semibold text-[#181114] mb-2">{currentUser?.levelName || 'N5'}</p>
          <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all" 
              style={{ width: `${currentUser?.progressPercent || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Thông tin User & Đăng xuất */}
        <div className="mt-auto">
          <div className="bg-[#fbf9fa] p-4 rounded-xl flex items-center justify-between gap-1 group border border-[#f4f0f2]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div 
                className="size-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm border-2 border-primary/20"
              >
                {currentUser?.fullName?.charAt(0).toUpperCase() || 'J'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-[#181114]">{currentUser?.fullName || 'Học viên'}</p>
                <p className="text-[10px] text-[#886373] truncate">{currentUser?.email || email || 'learner@jquiz.vn'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg text-red-500 hover:bg-white hover:shadow-sm transition-all duration-200 flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Component NavItem
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

// Component SubNavItem (Dành cho các mục con trong menu kỹ năng)
const SubNavItem = ({ to, label, active }: { to: string, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`py-2 px-2 rounded-lg text-sm transition-all block ${
      active ? 'text-primary font-bold' : 'text-[#886373] hover:text-primary'
    }`}
  >
    {label}
  </Link>
);

export default Sidebar;