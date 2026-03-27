import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import adminService from '../services/Admin/adminService'; 
import { User } from '../interfaces/User';

// 1. Thunk: Lấy danh sách người dùng
export const fetchUsers = createAsyncThunk('admin/fetchUsers', async () => {
    const response = await adminService.getAllUsers();
    return response.data; 
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
            return payload; 
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
        onlineCount: 0, // <--- THÊM DÒNG NÀY: Để lưu số lượng online
    },
    reducers: {
        // THÊM REDUCER NÀY: Để cập nhật số lượng từ SignalR
        setOnlineCount: (state, action: PayloadAction<number>) => {
            state.onlineCount = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                if (JSON.stringify(state.users) !== JSON.stringify(action.payload)) {
                    state.users = action.payload;
                }
            })
            .addCase(toggleUserLock.fulfilled, (state, action) => {
                const { userId, isLocked } = action.payload;
                const user = state.users.find(u => u.id === userId);
                if (user) {
                    user.isLocked = isLocked;
                }
            })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const user = state.users.find(u => u.id === action.payload.userId);
                if (user) {
                    user.role = action.payload.newRole;
                }
            });
    },
});

// QUAN TRỌNG: Phải export setOnlineCount ở đây
export const { setOnlineCount } = adminSlice.actions;

export default adminSlice.reducer;