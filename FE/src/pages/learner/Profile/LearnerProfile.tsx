import React, { useEffect, useState, useRef } from 'react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import { User } from '../../../interfaces/User';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../store/auth.slice';
import { AppDispatch } from '../../../store';
import dashboardService from '../../../services/Learner/progressService';
import { DashboardProgressResponse } from '../../../interfaces/Learner/Dashboard';
const LearnerProfile: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPendingChanges = isEditing || previewImage !== null;
  const [dashboardData, setDashboardData] = useState<DashboardProgressResponse | null>(null);

  const totalPercent = dashboardData?.totalPercent ?? 0;
  const currentLevelName = dashboardData?.currentLevelName ?? profile?.levelName ?? 'N5';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
       const [profileData, progressRes] = await Promise.all([
      LearnerProfileService.getCurrentProfile(),
      dashboardService.getOverallProgress(),
    ]);

    setProfile(profileData);
    setEditData(profileData);
    setDashboardData(progressRes.data);
    } catch (error) {
      setError('Không thể tải hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {

        const imageData = reader.result as string;
        
        setPreviewImage(imageData);
         setEditData((prev) => ({
        ...prev,
        avatarUrl: imageData,
      }));

      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const payload: Partial<User> = {
        ...editData,
        avatarUrl: previewImage ?? profile?.avatarUrl,
      };

      const updatedProfile = await LearnerProfileService.updateProfile(payload);
      setProfile(updatedProfile);
      setEditData(updatedProfile);
      setPreviewImage(null);
      setIsEditing(false);
      alert('Cập nhật thành công!');
    } catch (err) {
      alert('Lỗi khi cập nhật!');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadgeClasses = (levelName?: string) => {
    switch (levelName) {
      case 'N3':
        return 'bg-emerald-100 text-emerald-700';
      case 'N4':
        return 'bg-amber-100 text-amber-700';
      case 'N5':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-[#f4f0f2] text-[#886373]';
    }
  };

  const getProgressTextClasses = () => {
      return 'text-primary';
  };

  const getProgressBadgeClasses = (percent: number) => {

    if (percent >= 75)
    return 'bg-emerald-100 text-emerald-700';

    if (percent >= 40)
      return 'bg-amber-100 text-amber-700';

    return 'bg-rose-100 text-rose-700';

  };

  const getProgressBarClasses = (percent: number) => {
    if (percent >= 75)
    return 'bg-gradient-to-r from-primary to-primary/70';

    if (percent >= 40)
      return 'bg-gradient-to-r from-[#ffcc70] to-[#f59e0b]';

    return 'bg-gradient-to-r from-[#ff9b9b] to-[#ef4444]';
  };

  const getProgressLabel = (percent: number) => {
    if (percent >= 75) return 'Tốt';
    if (percent >= 40) return 'Đang tiến bộ';
    return 'Cần cố gắng';
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return 'Học viên';
    if (role === 'Learner') return 'Học viên';
    return role;
  };

  const isMinimalLevel = profile?.levelName === 'N3';

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader title="Hồ sơ cá nhân" />

      <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-3xl border-2 border-[#f4f0f2] bg-white p-8 shadow-sm flex flex-col items-center">
            <div className="relative inline-flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 shadow-lg overflow-visible">
              {previewImage || profile?.avatarUrl ? (
                <img
                  src={previewImage || (profile?.avatarUrl as string)}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-primary">{profile?.fullName?.charAt(0).toUpperCase()}</span>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 translate-x-2 translate-y-2 rounded-full bg-primary p-2 text-white shadow-lg hover:brightness-105 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-[#886373]">Chào mừng học viên</p>
              <h2 className="mt-3 text-2xl font-bold text-[#181114]">{profile?.fullName}</h2>
              <p className="mt-1 text-sm text-[#886373]">{profile?.email}</p>
            </div>

            <div className="mt-7 grid gap-4 w-full">
              <div className="rounded-3xl bg-[#fbf9fa] p-4 shadow-sm border-2 border-[#f4f0f2]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#886373]">Vai trò</p>
                    <p className="mt-2 text-lg font-semibold text-[#181114]">{getRoleLabel(profile?.role)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile?.isLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {profile?.isLocked ? 'Khóa' : 'Đang hoạt động'}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl bg-[#fbf9fa] p-4 shadow-sm border-2 border-[#f4f0f2]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#886373]">Cấp độ hiện tại</p>
                    <p className="mt-2 text-lg font-semibold text-[#181114]">{profile?.levelName || 'N5'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getLevelBadgeClasses(profile?.levelName)}`}>
                    {profile?.levelName || 'N5'}
                  </span>
                </div>
                {/* <p className="mt-3 text-sm text-[#886373]">Ôn luyện theo lộ trình JLPT hiện tại.</p> */}
              </div>

              <div className="rounded-[2.5rem] bg-[#fbf9fa] p-6 border-2 border-[#f4f0f2] shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#886373]">Tiến độ tổng thể</p>
                    <p className={`mt-2 text-2xl font-semibold ${getProgressTextClasses()}`}>{totalPercent}%</p>
                  </div>
                  <span className={` shink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold ${getProgressBadgeClasses(totalPercent)}`}>
                    {getProgressLabel(totalPercent)}
                  </span>
                </div>
                <div className="mt-4 h-3 rounded-full bg-[#f4f0f2] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getProgressBarClasses(totalPercent)}`}
                    style={{ width: `${totalPercent}%` }}
                  />
                </div>
              </div>

            </div>
          </section>
        </aside>

        <main className="space-y-6">
          <section className="rounded-3xl border-2 border-[#f4f0f2] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#181114]">Thông tin cá nhân</h3>
                <p className="mt-1 text-sm text-[#886373]">Cập nhật tên hiển thị và ảnh đại diện.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {!hasPendingChanges ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-105 transition-colors"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Chỉnh sửa
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-105 transition-colors"
                    >
                      Lưu thay đổi
                    </button>

                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setPreviewImage(null);
                        setEditData(profile ?? {});
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border-2 border-[#f4f0f2] bg-white px-4 py-2 text-sm font-semibold text-[#181114] hover:bg-[#fbf9fa] transition-colors"
                    >
                      Hủy
                    </button>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Đăng xuất
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-[#886373] uppercase mb-2 block">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full rounded-2xl border-2 border-[#f4f0f2] bg-[#fbf9fa] px-4 py-3 text-[#181114] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    value={editData.fullName || ''}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  />
                ) : (
                  <p className="rounded-2xl border-2 border-[#f4f0f2] bg-[#fbf9fa] px-4 py-3 text-[#181114]">{profile?.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#886373] uppercase mb-2 block">Email</label>
                <p className="rounded-2xl border-2 border-[#f4f0f2] bg-[#fbf9fa] px-4 py-3 text-[#181114]">{profile?.email}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleSaveProfile}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-105 transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewImage(null);
                    setEditData(profile ?? {});
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-[#f4f0f2] bg-white px-6 py-3 text-sm font-semibold text-[#181114] hover:bg-[#fbf9fa] transition-colors"
                >
                  Hủy
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border-2 border-[#f4f0f2] bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#181114]">Bảng tổng quan</h3>
                <p className="mt-1 text-sm text-[#886373]">Tóm tắt trạng thái học tập và tài khoản.</p>
              </div>
              <span className="rounded-full bg-[#f4f0f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#886373]">
                {profile?.levelName || 'N5'}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border-2 border-[#f4f0f2] bg-[#fbf9fa] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#886373]">Trạng thái</p>
                <p className="mt-3 text-lg font-semibold text-[#181114]">{profile?.isLocked ? 'Đã khóa' : 'Đang hoạt động'}</p>
              </div>
              <div className="rounded-3xl border-2 border-[#f4f0f2] bg-[#fbf9fa] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#886373]">Vai trò</p>
                <p className="mt-3 text-lg font-semibold text-[#181114]">{getRoleLabel(profile?.role)}</p>
              </div>
              <div className="rounded-3xl border-2 border-[#f4f0f2] bg-[#fbf9fa] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#886373]">Tiến độ</p>
                <p className={`mt-3 text-lg font-semibold ${getProgressTextClasses()}`}>{totalPercent}%</p>
              </div>
            </div>
          </section>
        </main>
      </div>
      </main>
    </div>
  );
};

export default LearnerProfile;