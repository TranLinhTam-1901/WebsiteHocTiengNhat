import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:7055/api',
});

// 1. Gửi Token lên mỗi lần gọi API
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Xử lý phản hồi từ Server (Đặc biệt là lỗi bị đá phiên)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const data = error.response.data;

      // Kiểm tra FLAG isForceLogout từ Middleware truyền về
      if (data?.isForceLogout === true) {
        // Chỉ thực hiện đá ra nếu vẫn còn token (tránh loop vô tận)
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
          
          const logoutMsg = encodeURIComponent(data.message || "Tài khoản của bạn đã đăng nhập ở nơi khác.");
          
          // Dùng replace thay vì href để người dùng không quay lại trang cũ được bằng nút Back
          window.location.replace(`/login?reason=forced&message=${logoutMsg}`);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;