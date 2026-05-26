import React, { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../../../components/layout/admin/AdminHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store'; 
import { fetchUsers, toggleUserLock, updateUserRole } from '../../../store/admin.slice';
import { User } from '../../../interfaces/User';
import  adminService  from '../../../services/Admin/adminService';
import { DashboardProgressResponse } from '../../../interfaces/Admin/ProgressDetail';
import { LearnersProgressSummary } from '../../../interfaces/Admin/LearnersProgressSummary';

const ROLE_OPTIONS = [
  { value: 'Learner', label: 'Học viên' },
  { value: 'Admin', label: 'Quản trị viên' },
] as const;

function normalizeRole(role: string | undefined): string {
  const r = role?.trim() || '';
  if (r.toLowerCase() === 'admin') return 'Admin';
  if (r.toLowerCase() === 'learner') return 'Learner';
  return ROLE_OPTIONS.some((o) => o.value === r) ? r : 'Learner';
}

function isAdminUser(u: User): boolean {
  return normalizeRole(u.role) === 'Admin';
}

function matchesUserSearch(u: User, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = u.fullName?.toLowerCase() ?? '';
  const email = u.email?.toLowerCase() ?? '';
  return name.includes(q) || email.includes(q);
}

const LearnerList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdmins, setShowAdmins] = useState(false);
  const [progressSummary, setProgressSummary] = useState<LearnersProgressSummary | null>(null);
  const [progressSummaryLoading, setProgressSummaryLoading] = useState(false);

  // State quản lý Modal
  const [selectedProgress, setSelectedProgress] = React.useState<DashboardProgressResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = React.useState(false);

  // Hàm xử lý khi nhấn xem chi tiết
  const handleViewDetail = async (userId: string) => {
    try {
      setIsFetchingDetail(true);
      setIsModalOpen(true);
      const data = await adminService.getLearnerProgress(userId);
      setSelectedProgress(data);
    } catch (error) {
      console.error("Lỗi khi lấy tiến độ chi tiết", error);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // Lấy onlineCount trực tiếp từ Redux Store
  const { users, loading, onlineCount } = useSelector((state: RootState) => state.admin);

  const loadProgressSummary = async () => {
    try {
      setProgressSummaryLoading(true);
      const summary = await adminService.getLearnersProgressSummary();
      setProgressSummary(summary);
    } catch (error) {
      console.error('Lỗi khi tải tiến độ trung bình:', error);
      setProgressSummary(null);
    } finally {
      setProgressSummaryLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
    loadProgressSummary();
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchUsers());
    loadProgressSummary();
  };

  const allUsers = users as User[];

  const adminUsers = useMemo(
    () => allUsers.filter(isAdminUser),
    [users]
  );

  const learnerOnlyUsers = useMemo(
    () => allUsers.filter((u) => !isAdminUser(u)),
    [users]
  );

  const displayUsers = useMemo(() => {
    const adminsFiltered = adminUsers.filter((u) => matchesUserSearch(u, searchQuery));
    const learnersFiltered = learnerOnlyUsers.filter((u) => matchesUserSearch(u, searchQuery));
    if (showAdmins) {
      return [...adminsFiltered, ...learnersFiltered];
    }
    return learnersFiltered;
  }, [adminUsers, learnerOnlyUsers, searchQuery, showAdmins]);

  const searchTrim = searchQuery.trim();
  const tableFooterText =
    showAdmins ? (
      <>
        Hiển thị <span className="text-[#181114] font-bold">{displayUsers.length}</span> dòng
        {searchTrim ? (
          <span className="text-slate-400"> phù hợp &ldquo;{searchTrim}&rdquo;</span>
        ) : null}
        <span className="text-slate-500">
          {' '}
          · Quản trị đứng đầu · Trong hệ thống: {adminUsers.length} quản trị, {learnerOnlyUsers.length} học viên
        </span>
      </>
    ) : searchTrim ? (
      <>
        Hiển thị <span className="text-[#181114] font-bold">{displayUsers.length}</span> /{' '}
        {learnerOnlyUsers.length} học viên phù hợp &ldquo;{searchTrim}&rdquo;
      </>
    ) : (
      <>
        Hiển thị <span className="text-[#181114] font-bold">{displayUsers.length}</span> học viên
      </>
    );

  return (
    <div className="flex flex-col h-screen bg-background-light font-display text-[#181114]">
      <AdminHeader>
        <div className="flex items-center gap-170 w-full">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ HỌC VIÊN</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên/email..."
                aria-label="Tìm kiếm người dùng"
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>

            <button 
              onClick={handleRefresh}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all no-underline shadow-lg shadow-primary/20 shrink-0"
            >
              <span className={`material-symbols-outlined text-sm ${loading || progressSummaryLoading ? 'animate-spin' : ''}`}>refresh</span>
              Làm mới
            </button>

            <button
              type="button"
              onClick={() => setShowAdmins((v) => !v)}
              title={showAdmins ? 'Ẩn quản trị viên khỏi bảng' : 'Hiện quản trị viên ở đầu bảng'}
              className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all no-underline shrink-0 border-2 ${
                showAdmins
                  ? 'bg-white border-primary text-primary shadow-md shadow-primary/10 hover:bg-primary/5'
                  : 'bg-primary border-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {showAdmins ? 'visibility' : 'visibility_off'}
              </span>
              {showAdmins ? 'Ẩn admin' : 'Hiện admin'}
            </button>
          </div>
        </div>
      </AdminHeader>

      <div className="flex-1 overflow-hidden p-8 pb-20">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-full p-6 flex items-center justify-between shadow-sm border border-[rgba(242,135,182,0.1)] group transition-all">
            <div className="flex items-center gap-4 ml-2">
              <div className="h-14 w-14 rounded-full bg-[#f287b6]/10 flex items-center justify-center text-[#f287b6]">
                <span className="material-symbols-outlined text-3xl">group</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Tổng học viên</p>
                <h3 className="text-2xl font-bold">{learnerOnlyUsers.length}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-full p-6 flex items-center justify-between shadow-sm border border-[rgba(242,135,182,0.1)]">
            <div className="flex items-center gap-4 ml-2">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-pulse">
                <span className="material-symbols-outlined text-3xl">sensors</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Đang trực tuyến</p>
                <h3 className="text-2xl font-bold">{onlineCount}</h3>
              </div>
            </div>
            <div className="mr-4 text-[#f287b6] text-xs font-bold italic">Realtime</div>
          </div>

          <div className="bg-white rounded-full p-6 flex items-center justify-between shadow-sm border border-[rgba(242,135,182,0.1)]">
            <div className="flex items-center gap-4 ml-2">
              <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Tiến độ trung bình</p>
                <h3 className="text-2xl font-bold">
                  {progressSummaryLoading
                    ? '…'
                    : progressSummary != null
                      ? `${progressSummary.averageProgressPercent}%`
                      : '—'}
                </h3>
                {progressSummary != null && progressSummary.learnersWithoutLevel > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {progressSummary.learnersWithoutLevel} HV chưa chọn level
                  </p>
                )}
              </div>
            </div>
            {/* <div className="mr-4 text-blue-500/80 text-[10px] font-bold uppercase max-w-[88px] text-right leading-tight hidden sm:block">
              TB TotalPercent
            </div> */}
          </div>
        </div>

        {/* Main Table - Giữ nguyên h-172 */}
        <div className="flex-1 overflow-hidden mt-8">
          <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-172">

            <div className="overflow-hidden flex-1 no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className='h-15'>
                  <tr className="bg-[rgb(251,249,250)] border-b border-[#f4f0f2] relative">
                    <th className="w-[22%] px-6 py-4 text-left text-sm font-bold text-[#886373] uppercase tracking-wider">Học viên</th>
                    <th className="w-[12%] px-4 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Trạng thái</th>
                    <th className="w-[12%] px-4 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Tiến độ</th>
                    <th className="w-[10%] px-4 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Mục tiêu</th>
                    <th className="w-[16%] px-4 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Email</th>
                    <th className="w-[16%] px-4 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Vai trò</th>
                    <th className="w-[12%] px-4 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f0f2]">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-sm text-slate-400 italic">Đang tải dữ liệu...</td></tr>
                  ) : displayUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-sm text-slate-400 italic">
                        Không có kết quả phù hợp.
                      </td>
                    </tr>
                  ) : (
                    displayUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-primary/5 transition-colors h-24.5 ${
                          isAdminUser(user) ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Cột Học viên */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                              {user.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate font-bold text-sm text-[#181114]">{user.fullName}</span>
                          </div>
                        </td>

                        {/* Cột Trạng thái */}
                        <td className="px-4 py-5 text-center">
                          <span className={`text-sm font-bold ${user.isLocked ? "text-red-500" : "text-green-500"}`}>
                            {user.isLocked ? "Đã khóa" : "Hoạt động"}
                          </span>
                        </td>

                        {/* Cột Tiến độ */}
                       <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleViewDetail(user.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 group shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[18px] group-hover:rotate-180 transition-transform duration-500">
                            monitoring
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider">Xem tiến độ</span>
                        </button>
                        
                        {/* Chú thích nhỏ bên dưới nếu muốn */}
                        {/* <p className="text-[9px] text-slate-400 mt-1 font-medium italic">Click để tính toán 70/30</p> */}
                      </td>

                        {/* Cột Mục tiêu (JLPT) */}
                        <td className="px-4 py-5 text-center">
                          <span className="px-3 py-1 bg-[#f287b6]/10 text-primary rounded-lg text-xs font-bold uppercase border border-[#f287b6]/20">
                            {user.levelName || 'N5'}
                          </span>
                        </td>

                        {/* Cột Email */}
                        <td className="px-4 py-5 text-center">
                            <span className="text-xs text-[#886373] truncate block">{user.email}</span>
                        </td>

                        {/* Cột Vai trò — dropdown đổi role */}
                        <td className="px-4 py-5 text-center">
                          <div className="relative inline-block w-full max-w-40 mx-auto">
                            <select
                              aria-label={`Đổi vai trò cho ${user.fullName}`}
                              value={normalizeRole(user.role)}
                              disabled={updatingRoleFor === user.id}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const current = normalizeRole(user.role);
                                if (newRole === current) return;
                                setUpdatingRoleFor(user.id);
                                try {
                                  await dispatch(updateUserRole({ userId: user.id, newRole })).unwrap();
                                } catch {
                                  window.alert('Không thể đổi vai trò. Vui lòng thử lại.');
                                } finally {
                                  setUpdatingRoleFor(null);
                                }
                              }}
                              className="w-full appearance-none rounded-lg border border-[#f4f0f2] bg-white py-2 pl-3 pr-8 text-left text-xs font-bold text-[#181114] shadow-sm outline-none transition-all hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#886373] material-symbols-outlined text-lg">
                              expand_more
                            </span>
                          </div>
                        </td>

                        {/* Cột Thao tác */}
                        <td className="px-4 py-5 text-right">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => dispatch(toggleUserLock({ userId: user.id, isLocked: user.isLocked }))}
                              className={`p-2 rounded-lg border border-[#f4f0f2] transition-all ${
                                user.isLocked ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-white text-[#886373] hover:text-red-500 hover:bg-red-50'
                              }`}
                              title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {user.isLocked ? 'lock_open' : 'lock'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">

              {/* Nút đóng */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-red-500"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold mb-2">
                Chi tiết tiến độ học viên
              </h2>
              {selectedProgress && !isFetchingDetail && (
                <p className="text-sm text-primary font-bold mb-6">
                  Tiến độ tổng: {selectedProgress.totalPercent}% · {selectedProgress.currentLevelName}
                </p>
              )}
              {isFetchingDetail && (
                <p className="text-sm text-slate-400 mb-6 animate-pulse">Đang tính toán...</p>
              )}
             <div className="space-y-4"> 
                {/* Lesson */}
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-[#181114]">
                      📚 BÀI HỌC (35%)
                    </span>

                    <span className="text-xs font-bold text-primary">
                      {selectedProgress?.courseProgress.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{
                        width: `${selectedProgress?.courseProgress.percentage}%`
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Hoàn thành {selectedProgress?.courseProgress.completed}/
                    {selectedProgress?.courseProgress.total} bài học.
                  </p>
                </div>

                {/* Exam Pass */}
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-[#181114]">
                      ✅ Bài thi luyện tập (35%)
                    </span>

                    <span className="text-xs font-bold text-emerald-600">
                      {selectedProgress?.examProgress?.passRate}%
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${selectedProgress?.examProgress?.passRate}%`
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Đã vượt qua {selectedProgress?.examProgress?.passedExams}/
                    {selectedProgress?.examProgress?.totalExams} bài luyện tập.
                  </p>
                </div>

                {/* Average Score */}
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-[#181114]">
                      📊 ĐIỂM TRUNG BÌNH (20%)
                    </span>

                    <span className="text-xs font-bold text-blue-600">
                      {selectedProgress?.examProgress?.averageScore}/10
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                       width: `${(selectedProgress?.examProgress?.averageScore || 0) * 10}%`
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Điểm trung bình các bài thi đã làm.
                  </p>
                </div>

                {/* Flashcard */}
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-[#181114]">
                      💎 FLASHCARD (10%)
                    </span>

                    <span className="text-xs font-bold text-amber-600">
                      {selectedProgress?.skillProgress.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{
                        width: `${selectedProgress?.skillProgress.percentage}%`
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Đã ghi nhớ {selectedProgress?.skillProgress.completed}/
                    {selectedProgress?.skillProgress.total} flashcard.
                  </p>
                </div>
              </div>
              </div>
              </div>)}
            </div>

            {/* Pagination Footer */}
            <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white h-20">
              <p className="text-xs text-[#886373] font-medium">{tableFooterText}</p>
              
              <div className="flex items-center gap-2">
                  <button className="size-10 rounded-lg flex items-center justify-center border-2 border-[#f4f0f2] text-[#886373] hover:bg-[#f4f0f2] transition-all">
                    <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
                  </button>
                  <button className="size-10 rounded-lg flex items-center justify-center bg-primary text-white shadow-md shadow-primary/20 font-bold text-sm">1</button>
                  <button className="size-10 rounded-lg flex items-center justify-center border-2 border-[#f4f0f2] text-[#886373] hover:bg-[#f4f0f2] transition-all">
                    <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default LearnerList;