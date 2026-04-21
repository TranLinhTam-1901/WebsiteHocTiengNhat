import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/auth.slice';
import { authService } from '../../services/authService';
import { JLPTLevel } from '../../interfaces/auth';

const Register: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: any) => state.auth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [levelId, setLevelId] = useState('');
  const [levels, setLevels] = useState<JLPTLevel[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gọi API lấy dữ liệu khi component mount
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const data = await authService.getLevels();
        setLevels(data);
      } catch (error) {
        console.error("Không thể lấy danh sách trình độ:", error);
      }
    };
    fetchLevels();
  }, []);

  const getFullLevelName = (levelObj: JLPTLevel | undefined) => {
    if (!levelObj) return "Mục tiêu của bạn là gì?";
    
    const name = levelObj.name;
    let suffix = "";

    if (name.includes('N5')) suffix = " ・ Sơ cấp cơ bản";
    else if (name.includes('N4')) suffix = " ・ Sơ cấp nâng cao";
    else if (name.includes('N3')) suffix = " ・ Trung cấp mục tiêu";
    else if (name.includes('N2')) suffix = " ・ Thượng cấp chuyên sâu";
    else if (name.includes('N1')) suffix = " ・ Cao cấp thành thạo";

    return `${name}${suffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra thêm levelId trước khi gửi
    if (!email || !password || !fullName || !levelId) {
      alert("Vui lòng điền đầy đủ thông tin và chọn trình độ mục tiêu!");
      return;
    }

    // Thêm levelId vào payload gửi đi
    const result = await dispatch((registerUser as any)({ 
      email, 
      password, 
      fullName, 
      levelID: levelId // Lưu ý: key phải khớp với RegisterDTO ở Backend (levelID)
    }));

    if (result?.meta?.requestStatus === 'fulfilled') {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
      {/* Registration Card */}
      <div className="w-full max-w-130 h-240 bg-white rounded-xl shadow-xl border border-[#e5dcdf] overflow-hidden">
        <div className="p-8 pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
            </div>
          </div>
          <h1 className="text-[#181114] tracking-tight text-3xl font-bold leading-tight text-center">
            Tạo tài khoản JQuiz
          </h1>
          <p className="text-[#886370] text-sm font-normal leading-normal pt-2 text-center">
            Cá nhân hóa bằng AI bắt đầu ngay khi bạn tham gia.
          </p>
        </div>

        <form className="px-8 pb-10 space-y-5" onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#211118] text-sm font-bold ml-4 select-none">Họ và Tên</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#886370] text-xl z-10">
                person
              </span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="flex w-full rounded-full text-[#211118] border-2 border-[#f1ecf0] bg-white h-14 pl-12 pr-6 placeholder:text-slate-400 text-base font-normal focus:border-[#f287b6] focus:ring-4 focus:ring-[#f287b6]/10 outline-none transition-all shadow-sm"
                placeholder="Nhập họ và tên của bạn"
                type="text"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#211118] text-sm font-bold ml-4 select-none">Địa chỉ Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#886370] text-xl z-10">
                mail
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex w-full rounded-full text-[#211118] border-2 border-[#f1ecf0] bg-white h-14 pl-12 pr-6 placeholder:text-slate-400 text-base font-normal focus:border-[#f287b6] focus:ring-4 focus:ring-[#f287b6]/10 outline-none transition-all shadow-sm"
                placeholder="example@email.com"
                type="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#211118] text-sm font-bold ml-4 select-none">Mật khẩu</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#886370] text-xl z-10">
                lock
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex w-full rounded-full text-[#211118] border-2 border-[#f1ecf0] bg-white h-14 pl-12 pr-14 placeholder:text-slate-400 text-base font-normal focus:border-[#f287b6] focus:ring-4 focus:ring-[#f287b6]/10 outline-none transition-all shadow-sm"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
              />
              {/* Nút ẩn hiện pass */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#886370] hover:text-[#f287b6] transition-colors"
              >
                <span className="material-symbols-outlined text-xl select-none">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4">
              <label className="text-[#211118] text-sm font-bold select-none">Xác nhận mật khẩu</label>
              {confirmPassword && (
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-all ${password === confirmPassword ? 'text-emerald-500' : 'text-red-400'}`}>
                  {password === confirmPassword ? '✓ Trùng khớp' : '✕ Không khớp'}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#886370] text-xl z-10">
                enhanced_encryption
              </span>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`flex w-full rounded-full text-[#211118] border-2 bg-white h-14 pl-12 pr-14 placeholder:text-slate-400 text-base font-normal outline-none transition-all shadow-sm ${
                  confirmPassword 
                    ? (password === confirmPassword ? 'border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100' : 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-100') 
                    : 'border-[#f1ecf0] focus:border-[#f287b6] focus:ring-4 focus:ring-[#f287b6]/10'
                }`}
                placeholder="••••••••"
                type={showConfirmPassword ? "text" : "password"}
              />
              {/* Nút ẩn hiện pass */}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#886370] hover:text-[#f287b6] transition-colors"
              >
                <span className="material-symbols-outlined text-xl select-none">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Dropdown Goal Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#211118] text-sm font-bold ml-4 select-none">Mục tiêu JLPT</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#886370] text-xl z-10 select-none">
                flag
              </span>

              {/* Input giả lập Select */}
              <div
                onClick={() => setIsOpen(!isOpen)}
                className={`appearance-none w-full h-14 pl-12 pr-12 rounded-full border-2 transition-all duration-300 flex items-center cursor-pointer shadow-sm select-none
                  ${isOpen ? 'border-[#f287b6] ring-4 ring-[#f287b6]/10 bg-white' : 'border-[#f1ecf0] bg-white hover:border-[#f287b6]/30 hover:bg-[#fdf8fa]'}`}
              >
                <span className={levelId ? "text-[#211118]" : "text-slate-400"}>
                  {/* SỬA TẠI ĐÂY: Gọi hàm helper đã tạo ở trên */}
                  {getFullLevelName(levels.find(l => l.id === levelId))}
                </span>
              </div>

              {/* Menu Dropdown */}
              {isOpen && (
                <div className="absolute top-[110%] left-0 w-full bg-white border border-[#f1ecf0] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 select-none z-50">
                  <div className="max-h-75 overflow-y-auto">
                    
                    {/* Group: SƠ CẤP */}
                    <div className="px-4 py-2 text-[10px] text-slate-400 font-bold tracking-widest bg-slate-50 uppercase select-none">
                      SƠ CẤP
                    </div>
                    {levels.filter(l => l.name.includes('N5') || l.name.includes('N4')).map((l) => (
                      <div 
                        key={l.id}
                        onClick={() => { setLevelId(l.id); setIsOpen(false); }}
                        className="px-8 py-3 text-sm text-[#211118] hover:bg-[#f287b6] hover:text-white cursor-pointer transition-colors select-none"
                      >
                        {/* Logic thêm chữ đằng sau */}
                        {l.name} {l.name.includes('N5') ? '・ Sơ cấp cơ bản' : '・ Sơ cấp nâng cao'}
                      </div>
                    ))}

                    {/* Group: TRUNG & CAO CẤP */}
                    <div className="px-4 py-2 text-[10px] text-slate-400 font-bold tracking-widest bg-slate-50 uppercase select-none">
                      TRUNG VÀ CAO CẤP
                    </div>
                    {levels.filter(l => l.name.includes('N3') || l.name.includes('N2') || l.name.includes('N1')).map((l) => (
                      <div 
                        key={l.id}
                        onClick={() => { setLevelId(l.id); setIsOpen(false); }}
                        className="px-8 py-3 text-sm text-[#211118] hover:bg-[#f287b6] hover:text-white cursor-pointer transition-colors select-none"
                      >
                        {/* Logic thêm chữ đằng sau */}
                        {l.name} {
                          l.name.includes('N3') ? '・ Trung cấp mục tiêu' : 
                          l.name.includes('N2') ? '・ Thượng cấp chuyên sâu' : '・ Cao cấp thành thạo'
                        }
                      </div>
                    ))}

                    {/* Trường hợp đang tải hoặc mảng rỗng */}
                    {levels.length === 0 && (
                      <div className="px-8 py-3 text-sm text-slate-400 italic">Đang tải dữ liệu...</div>
                    )}
                  </div>
                </div>
              )}

              <span className={`material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[#886370] pointer-events-none transition-transform duration-300 select-none ${isOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>

            {/* Overlay ẩn để đóng menu khi click ra ngoài */}
            {isOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            )}
          </div>

          {/* AI Visual Hint */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
            <p className="text-xs text-[#886370] leading-relaxed">
              AI phân tích trình độ xuất phát của bạn để xây lộ trình học phù hợp, kèm ôn tập cách quãng theo tốc độ học của bạn.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-600 text-sm text-center">
              {String(error)}
            </p>
          )}

          {/* Submit Button */}
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg h-14 bg-primary text-white text-base font-bold shadow-lg shadow-primary/20 hover:bg-[#eb77a1] transition-all transform active:scale-[0.98]"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? 'Đang xử lý...' : 'Bắt đầu học'}</span>
            <span className="material-symbols-outlined">rocket_launch</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-[#886370]">
              Đã có tài khoản?{' '}
              <Link className="text-primary font-semibold hover:underline" to="/login">
                Quay lại đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;