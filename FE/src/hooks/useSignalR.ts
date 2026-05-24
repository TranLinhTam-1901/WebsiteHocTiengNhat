import { useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { useDispatch, useSelector } from 'react-redux'; // Thêm useSelector
import { setOnlineCount, fetchUsers } from '../store/admin.slice';
import { resolveBackendOrigin } from '../utils/resolveBackendOrigin';
import { getBrowserSessionId } from '../utils/browserSessionId';

export const useSignalR = () => {
  const dispatch = useDispatch();
  const connectionRef = useRef<HubConnection | null>(null);
  const isHandlingLogout = useRef(false); // Cờ chặn xử lý logout nhiều lần

  const token = useSelector((state: any) => state.auth.token);

  useEffect(() => {
    // Nếu không có token, ngắt kết nối cũ và thoát
    if (!token) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    // Chặn tạo kết nối trùng lặp
    if (connectionRef.current && connectionRef.current.state !== "Disconnected") return;

    const browserId = encodeURIComponent(getBrowserSessionId());
    const hubUrl = `${resolveBackendOrigin()}/presenceHub?browserId=${browserId}`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        // QUAN TRỌNG: Dùng trực tiếp biến token từ Redux để đảm bảo tính Realtime
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    const start = async () => {
      try {
        await connection.start();
        connectionRef.current = connection;

        // Xóa listener cũ trước khi gán mới để tránh bị gọi 2 lần (Popup 2 lần)
        connection.off("ForceLogout");
          connection.on("ForceLogout", (message: string) => {
            if (isHandlingLogout.current) return;
            isHandlingLogout.current = true;

            // 1. Xóa Token trước để chặn mọi hành động tiếp theo
            localStorage.removeItem("token");
            dispatch({ type: 'auth/logout' });

            // 2. Chuyển hướng NGAY LẬP TỨC (Bỏ alert để test tốc độ)
            const encodedMsg = encodeURIComponent(message || "Tài khoản đã đăng nhập nơi khác.");
            window.location.href = `/login?reason=forced&message=${encodedMsg}`;
        });

        connection.on("UpdateOnlineCount", (count: number) => {
          dispatch(setOnlineCount(count));
        });

        connection.on("ReceiveUserUpdate", () => {
          // @ts-ignore
          dispatch(fetchUsers());
        });

      } catch {
        connectionRef.current = null;
      }
    };

    start();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.off("ForceLogout"); // Hủy lắng nghe khi unmount
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [token, dispatch]); 
};