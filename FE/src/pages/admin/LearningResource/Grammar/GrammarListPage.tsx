import React, { useEffect, useState } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link, useNavigate } from 'react-router-dom';
import { grammarService } from '../../../../services/Admin/grammarService';
import { GrammarItem } from '../../../../interfaces/Admin/Grammar';

const GrammarListPage: React.FC = () => {
    const navigate = useNavigate();
    
    // 1. State quản lý dữ liệu
    const [grammars, setGrammars] = useState<GrammarItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('Toàn bộ');

    // State cho Popup xóa
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const grammarToDelete = grammars.find(g => g.id === deleteId);

    // 2. Fetch dữ liệu
    const fetchGrammars = async () => {
        try {
            setLoading(true);
            const data = await grammarService.getAll();
            setGrammars(data);
        } catch (error) {
            console.error("Lỗi tải ngữ pháp:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrammars();
    }, []);

    // 3. Xử lý xóa thực tế
    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await grammarService.delete(deleteId);
            setGrammars(prev => prev.filter(g => g.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            alert("Xóa thất bại, vui lòng thử lại!");
        }
    };

    // 4. Logic Lọc & Tìm kiếm
    const filteredData = grammars.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.meaning.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevel === 'Toàn bộ' || item.levelName === selectedLevel;
        return matchesSearch && matchesLevel;
    });

    // Hàm helper màu sắc
    const getLevelStyle = (level: string) => {
        if (level.includes('N5')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (level.includes('N4')) return 'bg-sky-50 text-sky-600 border-sky-100';
        if (level.includes('N3')) return 'bg-amber-50 text-amber-600 border-amber-100';
        if (level.includes('N2')) return 'bg-purple-50 text-purple-600 border-purple-100';
        if (level.includes('N1')) return 'bg-rose-50 text-rose-600 border-rose-100';
        return 'bg-gray-50 text-gray-500 border-gray-100';
    };

    return (
        <div className="flex flex-col h-full bg-background-light">
            <AdminHeader>
              <div className="flex items-center gap-101"> {/* Giữ nguyên gap-101 như bản gốc */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col">
                      <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ NGỮ PHÁP</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative hidden md:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm ngữ pháp..."
                      className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
                    />
                  </div>

                  {/* Add Button */}
                  <Link 
                    to="/admin/resource/grammar/create"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm Ngữ pháp
                  </Link>
                </div>
              </div>
            </AdminHeader>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Filter Bar */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                        {['Toàn bộ', 'N5', 'N4', 'N3', 'N2', 'N1'].map((lv) => (
                            <button 
                                key={lv} 
                                onClick={() => setSelectedLevel(lv)}
                                className={`px-5 py-2 text-[15px] font-bold rounded-full border transition-all ${
                                    selectedLevel === lv 
                                    ? 'bg-primary text-white shadow-md shadow-primary/20 border-primary' 
                                    : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary hover:text-primary'
                                }`}
                            >
                                {lv}
                            </button>
                        ))}
                    </div>

                    {deleteId && (
                      <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
                        {/* Overlay */}
                        <div 
                          className="absolute inset-0 bg-[#181114]/30 backdrop-blur-sm animate-in fade-in duration-500" 
                          onClick={() => setDeleteId(null)} 
                        />
                        
                        {/* Modal Content */}
                        <div className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.25)] border border-white/50 animate-in zoom-in-95 duration-300">
                          
                          {/* Icon Section: Giữ nguyên style box xoay hiện đại */}
                          <div className="relative size-24 rounded-3xl bg-linear-to-br from-[#fff5f5] to-[#fed7d7] flex items-center justify-center text-[#e53e3e] mb-8 mx-auto rotate-3 shadow-lg border-4 border-white">
                            <span className="material-symbols-outlined text-5xl">warning</span>
                            
                            <div className="absolute -top-2 -right-2 size-10 rounded-full bg-[#e53e3e] text-white flex items-center justify-center shadow-lg border-[3px] border-white -rotate-3">
                              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                            </div>
                          </div>
                          
                          <div className="text-center mb-10">
                            <h3 className="text-[22px] font-black text-[#181114] mb-5 tracking-tight">Xác nhận xóa dữ liệu?</h3>
                            
                            {/* Grammar Highlight Box với Subtitle */}
                            <div className="bg-[#fbf9fa] rounded-2xl p-5 border border-[#f4f0f2] mb-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                              <p className="text-2xl font-japanese font-black text-[#e53e3e] mb-1 leading-tight">
                                {grammarToDelete?.title}
                              </p>
                              {/* Chữ nhỏ ở dưới tên ngữ pháp */}
                              <p className="text-[15px] font-medium text-[#886373] italic opacity-80">
                                {grammarToDelete?.structure}
                              </p>
                            </div>

                            <p className="text-[#886373] text-sm leading-relaxed px-2">
                              Hành động này sẽ gỡ bỏ hoàn toàn cấu trúc khỏi hệ thống và không thể khôi phục lại.
                            </p>
                          </div>
                          
                          {/* Nút bấm đồng bộ */}
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

                    {/* Loading State */}
                    {loading ? (
                        <div className="text-center py-20 text-[#886373]">Đang tải dữ liệu...</div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {filteredData.map((item) => (
                                <div key={item.id} className="group bg-white rounded-2xl border border-[#f4f0f2] shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex overflow-hidden">
                                    {/* Left Side */}
                                    <div className="w-1/4 min-w-60 p-8 border-r border-[#f4f0f2] flex flex-col justify-center items-center bg-[#fbf9fa]/50">
                                        <h2 className="font-japanese text-2xl font-bold text-[#181114] text-center">{item.title}</h2>
                                        <h1 className="text-[18px] text-[#886373] text-center font-japanese mt-2 italic">{item.structure}</h1>
                                        <div className="mt-4">
                                            <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getLevelStyle(item.levelName)}`}>
                                                JLPT {item.levelName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Side */}
                                    <div className="flex-1 p-8 flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 pr-8">
                                                <h4 className="text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Meaning</h4>
                                                <p className="text-[#181114] font-medium text-base mb-1">{item.meaning}</p>
                                                <p className="text-xs text-[#886373] mb-4">Chủ đề: {item.topicName}</p>
                                                
                                                <h4 className="text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Structure</h4>
                                                <p className="text-[#181114] font-japanese text-sm bg-background-light/50 p-3 rounded-xl border border-[#f4f0f2] leading-relaxed mb-0">
                                                    {item.structure}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => navigate(`/admin/resource/grammar/edit/${item.id}`)}
                                                    className="size-10 bg-white border border-[#f4f0f2] hover:border-primary hover:text-primary transition-all rounded-xl flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteId(item.id)} 
                                                    className="size-10 bg-white border border-[#f4f0f2] hover:border-red-200 hover:text-red-500 transition-all rounded-xl flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrammarListPage;