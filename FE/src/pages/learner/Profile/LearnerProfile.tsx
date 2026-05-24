import React, { useEffect, useState, useRef } from 'react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import { User } from '../../../interfaces/User';

const LearnerProfile: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await LearnerProfileService.getCurrentProfile();
      setProfile(data);
      setEditData(data);
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
        setEditData({ ...editData, avatarUrl: imageData });
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
        return 'bg-sky-100 text-sky-700';
      case 'N5':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getProgressTextClasses = (percent: number) => {
    if (percent >= 75) return 'text-emerald-600';
    if (percent >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressBadgeClasses = (percent: number) => {
    if (percent >= 75) return 'bg-emerald-100 text-emerald-700';
    if (percent >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getProgressBarClasses = (percent: number) => {
    if (percent >= 75) return 'bg-emerald-500';
    if (percent >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
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

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <LearnerHeader title="Hồ sơ cá nhân" />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-4xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-indigo-50 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <div className="relative inline-flex h-36 w-36 items-center justify-center rounded-full bg-indigo-100 shadow-lg overflow-visible mx-auto">
              {previewImage || profile?.avatarUrl ? (
                <img
                  src={previewImage || (profile?.avatarUrl as string)}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-indigo-700">{profile?.fullName?.charAt(0).toUpperCase()}</span>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 translate-x-2 translate-y-2 rounded-full bg-indigo-600 p-2 text-white shadow-lg hover:bg-indigo-700 transition-colors"
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
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Chào mừng học viên</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">{profile?.fullName}</h2>
              <p className="mt-1 text-sm text-slate-500">{profile?.email}</p>
            </div>

            <div className="mt-7 grid gap-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vai trò</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{getRoleLabel(profile?.role)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile?.isLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {profile?.isLocked ? 'Khóa' : 'Đang hoạt động'}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cấp độ hiện tại</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{profile?.levelName || 'N5'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getLevelBadgeClasses(profile?.levelName)}`}>
                    {profile?.levelName || 'N5'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">Ôn luyện theo lộ trình JLPT hiện tại.</p>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tiến độ khóa học</p>
                    <p className={`mt-2 text-2xl font-semibold ${getProgressTextClasses(profile?.progressPercent ?? 0)}`}>{profile?.progressPercent ?? 0}%</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getProgressBadgeClasses(profile?.progressPercent ?? 0)}`}>
                    {getProgressLabel(profile?.progressPercent ?? 0)}
                  </span>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${getProgressBarClasses(profile?.progressPercent ?? 0)}`}
                    style={{ width: `${profile?.progressPercent ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Thông tin cá nhân</h3>
                <p className="mt-1 text-sm text-slate-500">Cập nhật tên hiển thị và ảnh đại diện.</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Chỉnh sửa
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={editData.fullName || ''}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  />
                ) : (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-900">{profile?.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email</label>
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-900">{profile?.email}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleSaveProfile}
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewImage(null);
                    setEditData(profile ?? {});
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bảng tổng quan</h3>
                <p className="mt-1 text-sm text-slate-500">Tóm tắt trạng thái học tập và tài khoản.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {profile?.levelName || 'N5'}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trạng thái</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{profile?.isLocked ? 'Đã khóa' : 'Đang hoạt động'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vai trò</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{getRoleLabel(profile?.role)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tiến độ</p>
                <p className={`mt-3 text-lg font-semibold ${getProgressTextClasses(profile?.progressPercent ?? 0)}`}>{profile?.progressPercent ?? 0}%</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LearnerProfile;