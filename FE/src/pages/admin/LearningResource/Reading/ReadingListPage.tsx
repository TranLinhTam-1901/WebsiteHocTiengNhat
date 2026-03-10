import React, { useEffect, useState } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { readingService } from '../../../../services/Admin/readingService'; // Điều chỉnh path cho đúng
import { ReadingItem } from '../../../../interfaces/Admin/Reading'; // Điều chỉnh path cho đúng

const ReadingManagement: React.FC = () => {
  const [passages, setPassages] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Reset về trang 1 mỗi khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Hàm lấy dữ liệu từ API
  const fetchReadings = async () => {
    try {
      setLoading(true);
      const data = await readingService.getAll();
      setPassages(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài đọc:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const filteredData = passages.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Cắt mảng để lấy dữ liệu cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Hàm bổ trợ xác định màu sắc dựa trên Level Name
  const getLevelStyles = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'N5': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'N4': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'N3': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'N2': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'N1': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  // Logic tìm kiếm đơn giản
  const filteredPassages = passages.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. Khai báo state để quản lý Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [readingToDelete, setReadingToDelete] = useState<{id: string, title: string} | null>(null);

  // 2. Hàm này chỉ để "Mở Modal"
  const handleDelete = (id: string, title: string) => {
    setDeleteId(id);
    setReadingToDelete({ id, title });
  };

  // 3. Hàm này mới thực sự là "Xác nhận xóa" (gọi khi bấm nút Xác nhận trong Modal)
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await readingService.delete(deleteId);
      // Cập nhật lại danh sách bài đọc (giả sử state của bạn là passages)
      setPassages(passages.filter(p => p.id !== deleteId));
      
      // Xóa xong thì đóng Modal và reset data
      setDeleteId(null);
      setReadingToDelete(null);
      // toast.success("Xóa bài đọc thành công!"); // Nếu bạn có dùng toast
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại!");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light">
      {/* --- Header Section --- */}
      <AdminHeader>
        <div className="flex items-center gap-110">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ BÀI ĐỌC</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm bài đọc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
              />
            </div>

            <Link 
              to="/admin/resource/reading/create"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              Thêm Bài đọc
            </Link>
          </div>
        </div>
      </AdminHeader>

      {deleteId && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
          {/* Overlay: Backdrop blur đồng bộ hệ thống */}
          <div 
            className="absolute inset-0 bg-[#181114]/40 backdrop-blur-md animate-in fade-in duration-500" 
            onClick={() => setDeleteId(null)} 
          />
          
          {/* Modal Content: Bo góc tròn đặc trưng [3rem] */}
          <div className="relative bg-white rounded-[3rem] p-10 max-w-105 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.3)] border border-white/50 animate-in zoom-in-95 duration-300">
            
            {/* Visual Identity: Thay chữ Hán bằng Icon tài liệu */}
            <div className="relative size-32 rounded-[2.5rem] bg-linear-to-br from-[#fff1f2] to-[#ffe4e6] flex flex-col items-center justify-center text-[#e11d48] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(225,29,72,0.1)] border-4 border-white rotate-3">
              <span className="material-symbols-outlined text-5xl drop-shadow-sm scale-110">
                auto_stories {/* Icon cuốn sách/bài đọc */}
              </span>
              
              {/* Badge Delete: Vị trí góc dưới phải */}
              <div className="absolute -bottom-2 -right-2 size-11 rounded-full bg-[#e11d48] text-white flex items-center justify-center shadow-lg border-4 border-white -rotate-3">
                <span className="material-symbols-outlined text-[20px] font-bold">close</span>
              </div>
            </div>
            
            {/* Văn bản thông báo: Tập trung vào tiêu đề bài đọc */}
            <div className="text-center mb-10">
              <h3 className="text-[24px] font-black text-[#181114] mb-3 tracking-tight">Gỡ bỏ bài đọc?</h3>
              <p className="text-[#886373] text-sm leading-relaxed px-4">
                Toàn bộ nội dung liên quan đến bài đọc <span className="inline-block mt-2 font-bold text-[#e11d48] bg-[#fff1f2] px-3 py-1 rounded-xl italic">
                  "{readingToDelete?.title}"</span> sẽ bị gỡ bỏ.
              </p>
              <p className="text-[#886373] text-sm leading-relaxed px-2 mt-2">
                Hành động này sẽ không thể hoàn tác.
              </p>
            </div>
            
            {/* Nút bấm: Style Minimalist hiện đại */}
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
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="flex-1 overflow-hidden p-8">
        <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-full">
          <div className="overflow-hidden flex-1 no-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className='h-15'>
                <tr className="bg-[#fbf9fa] border-b border-[#f4f0f2]">
                  <th className="w-[40%] px-8 py-4 text-sm font-bold text-[#886373] uppercase tracking-wider">Tiêu đề</th>
                  <th className="w-[15%] px-8 py-4 text-sm font-bold text-[#886373] uppercase tracking-wider">Trạng thái</th>
                  <th className="w-[10%] px-8 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">JLPT</th>
                  <th className="w-[20%] px-8 py-4 text-sm font-bold text-[#886373] uppercase tracking-wider">Chủ đề</th>
                  <th className="w-[15%] px-8 py-4 text-right text-sm font-bold text-[#886373] uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f0f2]">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-sm text-slate-400">Đang tải...</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors h-23.5">
                    <td className="px-8 py-5 truncate font-bold text-sm text-[#181114]">{item.title}</td>
                    <td className="px-8 py-5"><span className="text-sm font-medium text-green-500">Hoạt động</span></td>
                    <td className="px-8 py-5 text-center">
                      <span className={`${getLevelStyles(item.levelName)} px-3 py-1 rounded-lg text-xs font-bold uppercase`}>{item.levelName}</span>
                    </td>
                    <td className="px-8 py-5 text-sm text-[#886373]">{item.topicName}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/resource/reading/edit/${item.id}`} className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2]"><span className="material-symbols-outlined text-lg">edit</span></Link>
                        <button onClick={() => handleDelete(item.id, item.title)} className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2] hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer đã sửa logic --- */}
          <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white">
            <p className="text-xs text-[#886373] font-medium">
              Hiển thị <span className="text-[#181114]">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)}</span> của {filteredData.length} kết quả
            </p>
            
            <div className="flex items-center gap-2">
              
              {/* Hiển thị số trang */}
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`size-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    currentPage === index + 1 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
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

export default ReadingManagement;