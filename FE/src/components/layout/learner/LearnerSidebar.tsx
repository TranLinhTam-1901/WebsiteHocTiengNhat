import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logout } from '../../../store/auth.slice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector} from 'react-redux';
import { AppDispatch, RootState} from '../../../store';
import { User } from '../../../interfaces/User';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import dashboardService from '../../../services/Learner/progressService';
import { DashboardProgressResponse } from '../../../interfaces/Learner/Dashboard';

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
  
  const fetchProfile = useCallback(async () => {
    try {
      const profile = await LearnerProfileService.getCurrentProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  }, []);


      const handleProtectedNavigation = (
      e: React.MouseEvent,
      path: string
    ) => {

      const isExamRunning =
        sessionStorage.getItem(
          'isExamInProgress'
        ) === 'true';

      if (!isExamRunning) return;

      e.preventDefault();

      window.dispatchEvent(
        new CustomEvent(
          'protected-navigation',
          {
            detail: {
              path
            }
          }
        )
      );
    };


    

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const onRefresh = () => {
      fetchProfile();
    };
    window.addEventListener('learner-profile-refresh', onRefresh);
    return () => window.removeEventListener('learner-profile-refresh', onRefresh);
  }, [fetchProfile]);

  useEffect(() => {
    if (isSkillActive) setIsSkillOpen(true);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const [progressData, setProgressData] = useState<DashboardProgressResponse | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await dashboardService.getOverallProgress();
      setProgressData(res.data);
    } catch (error) {
      console.error('Sidebar progress fetch failed', error);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
    window.addEventListener('learner-profile-refresh', fetchProgress);
    return () => window.removeEventListener('learner-profile-refresh', fetchProgress);
  }, [fetchProgress]);

  const progressSummary = useMemo(() => {
    const totalPercent = progressData?.totalPercent ?? 0;
    const currentLevel = progressData?.currentLevelName ?? currentUser?.levelName ?? 'N5';

    return {
      totalPercent,
      currentLevel,
      breakdown: [
        { label: 'Bài học', value: `${progressData?.courseProgress?.percentage ?? 0}%`, color: 'text-primary' },
        { label: 'Luyện tập', value: `${progressData?.examProgress?.passRate ?? 0}%`, color: 'text-emerald-600' },
        { label: 'Điểm TB', value: `${progressData?.examProgress?.averageScore ?? 0}/10`, color: 'text-blue-600' },
        { label: 'Flashcard', value: `${progressData?.skillProgress?.percentage ?? 0}%`, color: 'text-amber-600' },
      ],
    };
  }, [progressData, currentUser?.levelName]);

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
             onProtectedNavigate={handleProtectedNavigation}
          />

          <NavItem
            to="/learner/courses"
            icon="menu_book"
            label="Khóa học"
            active={
              location.pathname.startsWith('/learner/courses') ||
              /\/learner\/lessons\/[^/]+\/learn/.test(location.pathname)
            }
             onProtectedNavigate={handleProtectedNavigation}
          />

          {/* --- PHẦN 2: LỘ TRÌNH HỌC CHÍNH --- */}

          <NavItem 
            to="/learner/studyresource/vocabulary" 
            icon="menu_book" 
            label="Thư viện từ vựng" 
            active={location.pathname.startsWith('/learner/studyresource/vocabulary')} 
             onProtectedNavigate={handleProtectedNavigation}
          />
          <NavItem 
            to="/learner/studyresource/kanji" 
            icon="draw" 
            label="Thư viện Kanji" 
            active={location.pathname.startsWith('/learner/studyresource/kanji')} 
             onProtectedNavigate={handleProtectedNavigation}
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
                  onProtectedNavigate={handleProtectedNavigation}
                />
                <SubNavItem 
                  to="/learner/skill-learning/kanji" 
                  label="Hán tự" 
                  active={isSubItemActive('/skill-learning/kanji', SkillType.Kanji)} 
                  onProtectedNavigate={handleProtectedNavigation}
                />
                <SubNavItem 
                  to="/learner/skill-learning/grammar" 
                  label="Ngữ pháp" 
                  active={isSubItemActive('/skill-learning/grammar', SkillType.Grammar)} 
                  onProtectedNavigate={handleProtectedNavigation}
                />
                <SubNavItem 
                  to="/learner/skill-learning/reading" 
                  label="Luyện đọc" 
                  active={isSubItemActive('/skill-learning/reading', SkillType.Reading)} 
                  onProtectedNavigate={handleProtectedNavigation}
                />
                <SubNavItem 
                  to="/learner/skill-learning/listening" 
                  label="Luyện nghe" 
                  active={isSubItemActive('/skill-learning/listening', SkillType.Listening)}
                  onProtectedNavigate={handleProtectedNavigation}
                />
              </div>
            )}
          </div>

          {/* --- PHẦN 4: KIỂM TRA & KẾT QUẢ --- */}
          <NavItem 
            to="/learner/exams/jlpt-exams" 
            icon="assignment" 
            label="Kho đề thi JLPT" 
            active={location.pathname.startsWith('/learner/exams/jlpt-exams')} 
            onProtectedNavigate={handleProtectedNavigation}
          />

          <NavItem 
            to="/learner/exams/history" 
            icon="history" 
            label="Lịch sử & Tiến độ" 
            active={location.pathname.startsWith('/learner/exams/history')} 
            onProtectedNavigate={handleProtectedNavigation}
          />

          <NavItem 
            to="/learner/ai-tutor" 
            icon="smart_toy" 
            label="Trợ lý AI (Ollama)" 
            active={location.pathname === '/learner/ai-tutor'} 
            onProtectedNavigate={handleProtectedNavigation}
          />

          <NavItem 
            to="/learner/support" 
            icon="chat" 
            label="Chat hỗ trợ" 
            active={location.pathname === '/learner/support'} 
            onProtectedNavigate={handleProtectedNavigation}
          />

          <div className="my-4 border-t border-[#f4f0f2]"></div>
        </nav>

        <div className="bg-primary/5 px-3 py-2.5 rounded-xl border border-primary/10 mb-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-black text-primary uppercase tracking-wider">Tiến độ</span>
              <span className="text-[9px] font-bold text-[#886373] px-1.5 py-0.5 rounded-md bg-white/70 border border-primary/10">
                {progressSummary.currentLevel}
              </span>
            </div>
            <span className="text-base font-black text-[#181114] leading-none shrink-0">
              {progressSummary.totalPercent}%
            </span>
          </div>

          <div className="w-full bg-zinc-200/80 h-1 rounded-full overflow-hidden mb-2">
            <div
              className="bg-primary h-full transition-all duration-700 ease-out"
              style={{ width: `${progressSummary.totalPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {progressSummary.breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-1 text-[9px]">
                <span className="text-[#886373] font-medium truncate">{item.label}</span>
                <span className={`font-bold shrink-0 ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thông tin User & Đăng xuất */}
        <div className="mt-auto">
          <div 
            className={`bg-[#fbf9fa] p-3 rounded-xl flex items-center justify-between gap-2 border transition-all duration-200
              ${
                location.pathname === '/learner/profile'
                  ? 'border-primary bg-primary/5'
                  : 'border-[#f4f0f2]'
              }
            `}
          >
            {/* Phần thông tin User - Click vào để chuyển hướng sang Profile */}
            <button
              type="button"
              onClick={() => navigate('/learner/profile')}
              className="flex flex-1 items-center gap-3 overflow-hidden text-left group/user"
            >
              {/* Avatar */}
              <div className="size-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm border-2 border-primary/20 overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  currentUser?.fullName?.charAt(0).toUpperCase() || 'J'
                )}
              </div>

              {/* Tên & Email */}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-[#181114] group-hover/user:text-primary transition-colors">
                  {currentUser?.fullName || 'Học viên'}
                </p>
                <p className="text-[10px] text-[#886373] truncate">
                  {currentUser?.email || email || 'learner@jquiz.vn'}
                </p>
              </div>
            </button>

            {/* Nút Đăng xuất */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg text-red-500 hover:bg-white hover:shadow-sm hover:text-red-600 transition-all duration-200 flex items-center justify-center shrink-0"
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
const NavItem = ({ to = "#", icon, label, active = false,onProtectedNavigate }: { to?: string, icon: string, label: string, active?: boolean,onProtectedNavigate?: (
    e: React.MouseEvent,
    to: string
  ) => void }) => (
  <Link 
    to={to} 
    onClick={(e) =>
      onProtectedNavigate?.(e, to)
    }
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
const SubNavItem = ({ to, label, active, onProtectedNavigate }: { to: string, label: string, active: boolean, onProtectedNavigate?: (
    e: React.MouseEvent,
    to: string
  ) => void }) => (
  <Link 
    to={to} 
    onClick={(e) =>
      onProtectedNavigate?.(e, to)
    }
    className={`py-2 px-2 rounded-lg text-sm transition-all block ${
      active ? 'text-primary font-bold' : 'text-[#886373] hover:text-primary'
    }`}
  >
    {label}
  </Link>
);

export default Sidebar;