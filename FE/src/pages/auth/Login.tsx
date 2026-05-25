import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/auth.slice';
import { getBrowserSessionId } from '../../utils/browserSessionId';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, roles, token } = useSelector((state: any) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const location = useLocation();
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  // const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Lấy các tham số từ URL
    const params = new URLSearchParams(location.search);
    const reason = params.get('reason');
    const message = params.get('message');
    const redirect = params.get('redirect');

    // Lưu redirect URL nếu có
    // if (redirect) {
    //   setRedirectUrl(redirect);
    // }

    if (reason === 'forced' && message) {
      setNotifyMsg(message);
      
      // Tùy chọn: Xóa query string trên URL để khi F5 không hiện lại thông báo
      window.history.replaceState({}, document.title, "/login");
    }
  }, [location]);


  const registerLink = location.search
  ? `/register${location.search}`
  : '/register';


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email || !password) {

    toast.error(
      'Vui lòng nhập email và mật khẩu.',
      {
        duration: 3000,
      }
    );

    return;
  }

  try {
    const result = await dispatch(loginUser({ 
      email, 
      password, 
      rememberMe: remember,
      browserSessionId: getBrowserSessionId(),
    }) as any).unwrap();

    if (result?.token) {
      
      localStorage.setItem("token", result.token);

      toast.success('Đăng nhập thành công!',
        {
          duration: 1500,
        }
      );

      await new Promise(
        resolve => setTimeout(resolve, 800)
      );
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');

      const userRoles = result.roles || roles || [];

      const isAdmin = userRoles.some(
        (role: string) => role.toLowerCase() === 'admin'
      );

      if (isAdmin) {
        navigate('/admin', { replace: true });
        return;
      }

      if (redirect) {
        navigate(redirect, { replace: true });
        return;
      }

      navigate('/learner/dashboard', { replace: true });
    }
  } catch (err) {
    console.error("Login failed:", err);
  }
};
    const getErrorMessage = (err: any) => {
      if (!err) return '';

      if (typeof err === 'string') return err;

      if (Array.isArray(err)) {
        return err.map(e => e.description || e.message || String(e)).join('\n');
      }

      if (typeof err === 'object') {
        return err.message || err.description || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      }

      return 'Đăng nhập thất bại.';
    };
  return (
    <div className="flex w-full items-stretch">
      {/* Cột trái: Hình ảnh */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center text-white px-20 text-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBeJt_Vz3_wUaqYa2iTgTGLQQe796qNJiZ9xOh58qKpXPF3CQCcWW7HXQHRxpkGTGGWtH9h9-S8vPFWfXQoLmOvcxcWAXYmkZcb-lMJ9BHthtmEXtp1HCjt34i-mpgX1mNvTlqL5IkGyvJeplPjzvv3jKu00edvoHJZ_CNZvXPoNgq_W7cnmNfng4yxQg3RG17QaUco3S0rN92FcL0RSDoGbfMgaMakAqZrTt0Atj5n98w-k86J0_6avwh30mgJ7p6DTK_eHRc0kDKL')" }}
        ></div>
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        <div className="relative z-20 space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-4">
             <div className="size-12 text-white">
                {/* Icon JQuiz trắng trên nền ảnh */}
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"></path>
                </svg>
             </div>
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-tight">Chinh phục tiếng Nhật cùng AI</h1>
          <p className="text-xl font-light opacity-90 max-w-md mx-auto">
            Lộ trình cá nhân hóa từ N5 đến N3 bắt đầu từ đây. Cùng hàng nghìn học viên học thông minh hơn, không học vất vả hơn.
          </p>
          <div className="pt-8">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <span>Được hơn 50.000 học viên trên thế giới tin dùng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">

          {notifyMsg && (
            <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
              <div className="flex flex-col">
                <p className="text-amber-800 text-sm font-semibold">Phiên đăng nhập hết hạn</p>
                <p className="text-amber-700 text-xs mt-0.5">{notifyMsg}</p>
              </div>
            </div>
          )}
          
          <div className="mb-10">
            <h2 className="text-[#181114] text-3xl font-bold leading-tight mb-2">Chào mừng trở lại</h2>
            <p className="text-[#886370] text-base">Nhập thông tin đăng nhập để vào bảng điều khiển học tập.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-[#181114] text-sm font-semibold">Địa chỉ email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-[#e5dcdf] bg-white h-14 p-3.75 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[#181114] text-sm font-semibold">Mật khẩu</label>
                <Link className="text-primary text-xs font-bold hover:underline" to="/forgot-password">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#e5dcdf] bg-white h-14 p-3.75 pr-12 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#886370] hover:text-[#f287ae] transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                </button>
              </div>
            </div>

            {/* Remember Me - Thiết kế lại cho xinh hơn */}
            <div className="flex items-center gap-3 py-1 px-4 cursor-pointer group" onClick={() => setRemember(!remember)}>
              <div className="relative flex items-center justify-center size-5"> {/* Thêm justify-center và size-5 ở đây */}
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-[#f1ecf0] rounded-md checked:bg-[#f287b6] checked:border-[#f287b6] transition-all cursor-pointer outline-none absolute inset-0 z-10" 
                />
                
                {/* Sửa icon: Thêm text-xs/opacity-0, bỏ scale-0 */}
                <span className="material-symbols-outlined absolute text-white text-xs z-20 transition-all peer-checked:opacity-100 opacity-0 pointer-events-none font-bold">
                  check
                </span>
              </div>
              <label htmlFor="remember" className="text-sm text-[#886370] font-medium cursor-pointer select-none group-hover:text-[#f287b6]">
                Duy trì đăng nhập trong 30 ngày
              </label>
            </div>

           {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg mb-4">
              <p className="text-red-600 text-sm text-center font-medium">
                {getErrorMessage(error)}
              </p>
            </div>
          )}

            <button 
              className="w-full rounded-lg h-14 bg-primary text-white font-bold hover:bg-[#e07198] transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[#886370] text-sm">
              Chưa có tài khoản?{' '}
              <Link to={registerLink} className="text-primary font-bold hover:underline ml-1">Tạo tài khoản</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;