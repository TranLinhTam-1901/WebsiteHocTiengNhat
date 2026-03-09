import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RegisterPayload, LoginPayload, AuthResponse } from '../interfaces/auth';
import { authService } from '../services/authService';

interface AuthState {
  token: string | null;
  email: string | null;
  roles: string[];
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  email: null,
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      await authService.register(payload);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Đăng ký thất bại');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const data = await authService.login(payload);
      return data;
    } catch (error: any) {
      // console.log("Full Error BE:", error.response?.data);

    // Thử lấy message theo nhiều cách
    const serverMessage = 
        // error.response?.data?.message || // Nếu BE trả về { message: "..." }
        error.response?.data ||          // Nếu BE trả về chuỗi "..." đơn thuần
        'Đăng nhập thất bại';

    return rejectWithValue(serverMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    
    logout(state) {
      state.token = null;
      state.email = null;
      state.roles = [];
      state.error = null;

      localStorage.removeItem('token');
      localStorage.removeItem('roles');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.email = action.payload.email;
        // Normalize roles to lowercase for consistent comparisons across FE
        state.roles = (action.payload.roles || []).map((r) => String(r).toLowerCase());

        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('roles', JSON.stringify(state.roles));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
