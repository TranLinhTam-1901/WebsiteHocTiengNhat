import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../services//Admin/adminService'; // Giả sử bạn đã tạo file service này
import { User } from '../interfaces/User';

// 1. Thunk: Lấy danh sách người dùng
export const fetchUsers = createAsyncThunk('admin/fetchUsers', async () => {
  const response = await adminService.getAllUsers();
  return response.data; // Dữ liệu từ Backend trả về
});

// 2. Thunk: Khóa/Mở khóa người dùng
export const toggleUserLock = createAsyncThunk('admin/toggleLock', 
  async ({ userId, isLocked }: { userId: string, isLocked: boolean }) => {
  const response = await adminService.toggleLock(userId, !isLocked); 
    return { userId, isLocked: !isLocked, message: response.data.message };
});

export const updateUserRole = createAsyncThunk(
  'admin/changeRole',
  async (payload: { userId: string; newRole: string }, { rejectWithValue }) => {
    try {
      const response = await adminService.changeRole(payload);
      return payload; // Trả về thông tin để cập nhật UI
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Không thể đổi quyền");
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: [] as User[],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    // Các xử lý đồng bộ (nếu có) đặt ở đây
  },
  extraReducers: (builder) => {
    builder
      // Xử lý khi đang lấy danh sách
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
       if (JSON.stringify(state.users) !== JSON.stringify(action.payload))
        {
          state.users = action.payload;
        }
      })
      // Xử lý khi khóa/mở khóa thành công
      .addCase(toggleUserLock.fulfilled, (state, action) => {
        const { userId, isLocked, message } = action.payload;
        const user = state.users.find(u => u.id === userId);
        if (user) {
          user.isLocked = isLocked; // Đảo ngược trạng thái khóa trên giao diện
          
        }
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const user = state.users.find(u => u.id === action.payload.userId);
        if (user) {
          user.role = action.payload.newRole; // Cập nhật role mới vào danh sách đang hiển thị
        }
      });
  },
});

export default adminSlice.reducer;