import React, { useEffect, useState } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { grammarGroupService } from '../../../../services/Admin/grammarGroupService';
import { GrammarGroupItem } from '../../../../interfaces/Admin/GrammarGroup';

const GrammarGroupManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [grammargroups, setGrammarGroups] = useState<GrammarGroupItem[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 7;

  const fetchGrammarGroups = async () => {
    try {
        setLoading(true);
        // Gọi trực tiếp getAll của grammarGroupService
        const data = await grammarGroupService.getAll();
        setGrammarGroups(data);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhóm ngữ pháp:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrammarGroups();
  }, []);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDelete = (id: string, name: string) => {
    console.log("Đang nhấn xóa ID:", id);
    setDeleteId(id);
    setTopicToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
        await grammarGroupService.delete(deleteId);
        setGrammarGroups(grammargroups.filter(t => t.grammarGroupID !== deleteId));
        setDeleteId(null);
        setTopicToDelete(null);
    } catch (error) {
        console.error(error);
        alert("Xóa thất bại! nhóm ngữ pháp này có thể đang được sử dụng ở bài học khác.");
    }
  };

  // 1. Logic lọc theo SearchTerm (Tìm theo tên hoặc mô tả)
  const filteredData = grammargroups.filter((item: GrammarGroupItem) => {
    const search = searchTerm.toLowerCase();
    
    return !searchTerm || 
        item.groupName?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);
  });

  // 2. Tính toán phân trang
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }
  }, [searchTerm, totalPages]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex flex-col h-full bg-background-light">
      <AdminHeader>
        <div className="flex items-center gap-162">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ NHÓM NGỮ PHÁP</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm nhóm ngữ pháp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
              />
            </div>

            <Link 
              to="/admin/resource/grammar-group/create"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
            >
              <span className="material-symbols-outlined text-sm">folder</span>
              Thêm Nhóm ngữ pháp
            </Link>
          </div>
        </div>
      </AdminHeader>

      {deleteId && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
            {/* Backdrop */}
            <div 
            className="absolute inset-0 bg-[#181114]/40 backdrop-blur-md animate-in fade-in duration-500" 
            onClick={() => setDeleteId(null)} 
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-[3rem] p-10 max-w-105 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.3)] border border-white/50 animate-in zoom-in-95 duration-300">
            
            {/* Icon Section - Đổi sang icon 'category' hoặc 'folder' cho Topic */}
            <div className="relative size-32 rounded-[2.5rem] bg-linear-to-br from-[#fff1f2] to-[#ffe4e6] flex flex-col items-center justify-center text-[#e11d48] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(225,29,72,0.1)] border-4 border-white rotate-3">
                <span className="material-symbols-outlined text-5xl drop-shadow-sm scale-110">
                folder 
                </span>
                <div className="absolute -bottom-2 -right-2 size-11 rounded-full bg-[#e11d48] text-white flex items-center justify-center shadow-lg border-4 border-white -rotate-3">
                <span className="material-symbols-outlined text-[20px] font-bold">delete_forever</span>
                </div>
            </div>
            
            {/* Text Section */}
            <div className="text-center mb-10">
                <h3 className="text-[24px] font-black text-[#181114] mb-3 tracking-tight">Xóa nhóm ngữ pháp?</h3>
                <p className="text-[#886373] text-sm leading-relaxed px-4">
                Nhóm ngữ pháp <span className="inline-block mt-2 font-bold text-[#e11d48] bg-[#fff1f2] px-3 py-1 rounded-xl italic">
                    "{topicToDelete?.name}"</span> 
                <br/>sẽ bị gỡ khỏi hệ thống và các liên kết liên quan.
                </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-4">
                <button 
                onClick={() => setDeleteId(null)} 
                className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#f4f2f3] text-[#5a434d] font-black text-[12px] uppercase tracking-wider hover:bg-[#ece8ea] hover:text-[#181114] transition-all duration-200 active:scale-95 border border-[#e8e4e6]"
                >
                Hủy bỏ
                </button>
                <button 
                onClick={confirmDelete} 
                className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#e53e3e] text-white font-black text-[12px] uppercase tracking-wider hover:bg-[#c53030] shadow-xl shadow-red-100 hover:shadow-red-200 transition-all active:scale-95"
                >
                Xác nhận xóa
                </button>
            </div>
            </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden p-8">
        <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="overflow-hidden flex-1 no-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
                <thead className='h-15'>
                <tr className="bg-[rgb(251,249,250)] border-b border-[#f4f0f2] relative">
                    <th className="w-[45%] px-8 py-4 text-left text-sm font-bold text-[#886373] uppercase tracking-wider">
                    nhóm ngữ pháp
                    </th>
                    <th className="w-[25%] px-8 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">
                    Đang sử dụng
                    </th>
                    <th className="w-[30%] px-8 py-4 text-right text-sm font-bold text-[#886373] uppercase tracking-wider">
                    Thao tác
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f0f2]">
                {loading ? (
                    <tr>
                    <td colSpan={3} className="text-center py-10 text-sm text-slate-400">Đang tải danh sách nhóm ngữ pháp...</td>
                    </tr>
                ) : currentItems.length === 0 ? (
                    <tr>
                    <td colSpan={3} className="text-center py-10 text-sm text-slate-400">Không tìm thấy nhóm ngữ pháp nào.</td>
                    </tr>
                ) : currentItems.map((item) => (
                    <tr key={item.grammarGroupID} className="hover:bg-primary/5 transition-colors h-24.5">
                    {/* Tên & Mô tả: Làm đẹp với icon và phân cấp text */}
                    <td className="px-8 py-5 text-sm text-[#181114]">
                        <div className="flex items-center gap-3">
                        <div className="size-10 shrink-0 rounded-xl bg-[#fcf9fa] border border-[#f4f0f2] flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[22px]">category</span>
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-bold text-[15px] text-[#181114] truncate">{item.groupName}</span>
                            <span className="text-[#886373] text-xs italic truncate">
                            {item.description || "Không có mô tả"}
                            </span>
                        </div>
                        </div>
                    </td>

                    {/* Thống kê: Sử dụng Badge hiện đại */}
                    <td className="px-8 py-5 text-center">
                        <div className="inline-flex items-center px-3 py-1.5 bg-[#f8fafc] text-[#475569] rounded-lg border border-[#e2e8f0] font-bold text-[12px]">
                        <span className="material-symbols-outlined text-[16px] mr-1.5 text-primary">analytics</span>
                        {item.usageCount ?? 0} ngữ pháp
                        </div>
                    </td>

                    {/* Thao tác: GIỮ NGUYÊN GIAO DIỆN CŨ CỦA BẠN */}
                    <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                        <Link 
                            to={`/admin/resource/grammar-group/edit/${item.grammarGroupID}`} 
                            className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2]"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </Link>
                        
                        <button 
                            onClick={() => handleDelete(item.grammarGroupID, item.groupName)} 
                            className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2] hover:text-red-500"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

            {/* Pagination: GIỮ NGUYÊN GIAO DIỆN CŨ CỦA BẠN */}
            <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white h-20">
            <p className="text-xs text-[#886373] font-medium">
                Hiển thị <span className="text-[#181114]">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)}</span> của {filteredData.length} nhóm ngữ pháp
            </p>
            
            <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, index) => (
                <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`size-10 rounded-lg flex items-center justify-center border-2 border-[#f4f0f2] font-bold text-sm transition-all ${
                    currentPage === index + 1 
                        ? 'bg-primary text-white shadow-md shadow-primary/20 border-none' 
                        : 'text-[#886373] hover:bg-[#f4f0f2]'
                    }`}
                >
                    {index + 1}
                </button>
                ))}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarGroupManagement;