import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Import types trực tiếp từ store index
import { RootState, AppDispatch } from '../../../store'; 
import { fetchUsers, toggleUserLock, updateUserRole } from '../../../store/admin.slice';

const LearnerList: React.FC = () => {
  // Khai báo dispatch với kiểu AppDispatch để hỗ trợ thunk (gọi API)
  const dispatch = useDispatch<AppDispatch>();
  
  // Khai báo state với kiểu RootState để có gợi ý code (Intellisense)
  const { users, loading } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
  if (users.length === 0 && !loading) {
    dispatch(fetchUsers());
  }
}, [dispatch, users.length, loading]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#f4f0f2] animate-in fade-in duration-500">
      <div className="p-6 border-b border-[#f4f0f2] flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-[#181114]">Danh sách học viên</h3>
          <p className="text-xs text-[#886373]">Quản lý thông tin và trạng thái tài khoản</p>
        </div>
        <button 
          onClick={() => dispatch(fetchUsers())}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Làm mới"
        >
          <span className="material-symbols-outlined text-[#886373]">refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fcfafb] text-[#886373] text-[11px] uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Học viên</th>
              <th className="px-6 py-4 font-bold">Vai trò</th>
              <th className="px-6 py-4 font-bold">Trạng thái</th>
              <th className="px-6 py-4 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4f0f2]">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-[#886373]">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-[#fcfafb] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-[#f4f0f2] flex items-center justify-center font-bold text-primary">
                       {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="font-bold text-[#181114]">{user.fullName}</div>
                        <div className="text-xs text-[#886373]">{user.email}</div>
                      </div>
                    </div>
                  </td>

                 <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        if (window.confirm(`Bạn có chắc muốn đổi quyền của ${user.fullName} sang ${newRole}?`)) {
                          dispatch(updateUserRole({ userId: user.id, newRole }));
                        }
                      }}
                      disabled={loading} // Tránh thao tác khi đang tải
                      className={`text-[10px] font-black px-2 py-1 rounded border outline-none cursor-pointer transition-all ${
                        user.role === 'Admin'
                          ? 'bg-purple-50 text-purple-600 border-purple-100 focus:ring-purple-200'
                          : 'bg-blue-50 text-blue-600 border-blue-100 focus:ring-blue-200'
                      }`}
                    >
                      <option value="Admin">ADMIN</option>
                      <option value="Learner">LEARNER</option>
                      {/* Thêm các role khác nếu có */}
                    </select>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${user.isLocked ? 'text-red-500' : 'text-green-600'}`}>
                      <span className="material-symbols-outlined text-base">
                        {user.isLocked ? 'lock_person' : 'verified_user'}
                      </span>
                      {user.isLocked ? 'Đã khóa' : 'Hoạt động'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">

                    <button 
                      onClick={() => dispatch(toggleUserLock({
                        userId: user.id,
                        isLocked: user.isLocked
                      }))}
                      className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-all shadow-sm ${
                        user.isLocked 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'
                      }`}
                    >
                      {user.isLocked ? 'MỞ KHÓA' : 'KHÓA'}
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LearnerList;