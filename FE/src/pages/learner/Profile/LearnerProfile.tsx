import React, { useEffect, useState, useRef } from 'react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import dashboardService from '../../../services/Learner/progressService';
import { User } from '../../../interfaces/User';

const LearnerProfile: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  /** Tiến độ tổng (bài + thi + điểm + flashcard), đồng bộ dashboard */
  const [totalOverallPercent, setTotalOverallPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [data, progressRes] = await Promise.all([
        LearnerProfileService.getCurrentProfile(),
        dashboardService.getOverallProgress().catch(() => null),
      ]);
      setProfile(data);
      setEditData(data);
      const raw = progressRes?.data?.totalPercent;
      setTotalOverallPercent(
        raw != null ? Math.min(100, Math.max(0, Number(raw))) : 0,
      );
    } catch {
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
        setEditData((prev) => ({ ...prev, avatarUrl: imageData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
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
    } catch {
      alert('Lỗi khi cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPreviewImage(null);
    setEditData(profile ?? {});
  };

  const getLevelColor = (levelName?: string) => {
    switch (levelName) {
      case 'N1': return 'text-rose-600 bg-rose-50';
      case 'N2': return 'text-violet-600 bg-violet-50';
      case 'N3': return 'text-emerald-600 bg-emerald-50';
      case 'N4': return 'text-sky-600 bg-sky-50';
      case 'N5': return 'text-amber-600 bg-amber-50';
      default: return 'text-[#886373] bg-[#f4f0f2]';
    }
  };

  const getProgressBarColor = (percent: number) => {
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
    if (!role || role === 'Learner') return 'Học viên';
    return role;
  };

  const progressPercent = profile?.progressPercent ?? 0;
  const avatarSrc = previewImage || profile?.avatarUrl;

  const pageShell = (content: React.ReactNode) => (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader title="Hồ sơ cá nhân" />
      {content}
    </div>
  );

  if (loading && !profile) {
    return pageShell(
      <main className="flex-1 flex items-center justify-center">
        <p className="text-[#886373] text-sm animate-pulse">Đang tải hồ sơ...</p>
      </main>
    );
  }

  if (error) {
    return pageShell(
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-rose-100 px-8 py-10 text-center max-w-sm shadow-sm">
          <span className="material-symbols-outlined text-rose-400 text-4xl mb-3 block">error_outline</span>
          <p className="text-[#181114] font-semibold">{error}</p>
        </div>
      </main>
    );
  }

  return pageShell(
    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Thẻ hồ sơ chính */}
        <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden">
          <div className="h-28 bg-linear-to-r from-primary/15 via-primary/5 to-transparent" />

          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12">
              <div className="relative shrink-0">
                <div className="size-24 rounded-full ring-4 ring-white bg-[#f4f0f2] overflow-hidden flex items-center justify-center shadow-md">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" className="size-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {profile?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                    aria-label="Đổi ảnh đại diện"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-1">
                <h1 className="text-2xl font-bold text-[#181114] truncate">{profile?.fullName}</h1>
                <p className="text-[#886373] text-sm mt-0.5 truncate">{profile?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${getLevelColor(profile?.levelName)}`}>
                    {profile?.levelName || 'N5'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${profile?.isLocked ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                    <span className={`size-1.5 rounded-full ${profile?.isLocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    {profile?.isLocked ? 'Đã khóa' : 'Đang hoạt động'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-[#886373] bg-[#f4f0f2]">
                    {getRoleLabel(profile?.role)}
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#f4f0f2] bg-white text-[#181114] text-sm font-semibold hover:bg-[#fbf9fa] hover:border-primary/30 transition-colors self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Thông tin cá nhân */}
          <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-6 sm:p-8 h-full">
            <h2 className="text-base font-bold text-[#181114] mb-1">Thông tin cá nhân</h2>
            <p className="text-sm text-[#886373] mb-6">Cập nhật tên hiển thị và ảnh đại diện.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#886373] mb-1.5">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] px-4 py-3 text-[#181114] text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    value={editData.fullName || ''}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  />
                ) : (
                  <p className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] px-4 py-3 text-[#181114] text-sm">
                    {profile?.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#886373] mb-1.5">Email</label>
                <p className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] px-4 py-3 text-[#886373] text-sm truncate">
                  {profile?.email}
                </p>
                <p className="text-xs text-[#886373]/70 mt-1.5">Email không thể thay đổi.</p>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-[#f4f0f2]">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-[#f4f0f2] text-sm font-semibold text-[#886373] hover:bg-[#fbf9fa] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </section>

          {/* Tiến độ học tập */}
          <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-6 sm:p-8 h-full flex flex-col">
            <h2 className="text-base font-bold text-[#181114] mb-1">Tiến độ tổng</h2>
            <p className="text-sm text-[#886373] mb-6">Lộ trình JLPT {profile?.levelName || 'N5'} của bạn.</p>

            <div className="flex-1 flex flex-col justify-center space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#886373]">Hoàn thành khóa học</span>
                <span className="font-semibold text-[#181114]">
                  {profile?.completedLessons != null && profile?.totalLessons != null
                    ? `${profile.completedLessons}/${profile.totalLessons} bài`
                    : `${progressPercent}%`}
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-[#f4f0f2] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(totalOverallPercent)}`}
                  style={{ width: `${totalOverallPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#886373]">{totalOverallPercent}% hoàn thành tổng</span>
                <span className={`font-medium ${totalOverallPercent >= 75 ? 'text-emerald-600' : totalOverallPercent >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {getProgressLabel(totalOverallPercent)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Thông tin tài khoản */}
        <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#181114] mb-1">Thông tin tài khoản</h2>
          <p className="text-sm text-[#886373] mb-6">Tóm tắt trạng thái học tập và tài khoản.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] p-4">
              <p className="text-xs text-[#886373] mb-1">Vai trò</p>
              <p className="text-sm font-semibold text-[#181114]">{getRoleLabel(profile?.role)}</p>
            </div>
            <div className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] p-4">
              <p className="text-xs text-[#886373] mb-1">Cấp độ JLPT</p>
              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ${getLevelColor(profile?.levelName)}`}>
                {profile?.levelName || 'N5'}
              </span>
            </div>
            <div className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] p-4">
              <p className="text-xs text-[#886373] mb-1">Trạng thái</p>
              <p className={`text-sm font-semibold ${profile?.isLocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                {profile?.isLocked ? 'Đã khóa' : 'Đang hoạt động'}
              </p>
            </div>
            <div className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] p-4">
              <p className="text-xs text-[#886373] mb-1">Tiến độ</p>
              <p className="text-sm font-semibold text-[#181114]">{totalOverallPercent}%</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
};

export default LearnerProfile;
