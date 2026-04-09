import React, { useEffect, useState, useMemo } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { vocabService } from '../../../../services/Admin/vocabService';
import { VocabularyItem } from '../../../../interfaces/Admin/Vocabulary';

const VocabularyListPage: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Thêm vào cùng các state khác
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const vocabToDelete = vocabList.find(v => v.vocabID === deleteId);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [levels, setLevels] = useState<{id: string, name: string}[]>([]);
  const [topics, setTopics] = useState<{id: string, name: string}[]>([]);
  const [filterPage, setFilterPage] = useState<1 | 2>(1);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [wordTypes, setWordTypes] = useState<{id: string, name: string}[]>([]);
  const [selectedWordTypes, setSelectedWordTypes] = useState<string[]>([]);

  type SortDirection = 'asc' | 'desc' | null;
  const [isCommonOnly, setIsCommonOnly] = useState<boolean | null>(null);
  const [sortPriority, setSortPriority] = useState<SortDirection>(null);

  const filteredVocabs = useMemo(() => {
    // BƯỚC 1: LỌC (Sử dụng biến 'result' bên trong scope)
    const result = vocabList.filter((item: any) => {
        const s = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            item.word?.toLowerCase().includes(s) || 
            item.reading?.toLowerCase().includes(s) || 
            item.meaning?.toLowerCase().includes(s);

        const matchesLevel = selectedLevels.length === 0 || 
            selectedLevels.includes(item.levelName);

        const matchesTopic = selectedTopics.length === 0 || 
            item.topics?.some((topicName: string) => selectedTopics.includes(topicName));

        const matchesWordType = selectedWordTypes.length === 0 || 
            item.wordTypes?.some((typeName: string) => selectedWordTypes.includes(typeName));

        const statusMap: Record<string, number> = { 'Hoạt động': 1, 'Đang sửa': 0, 'Lưu trữ': 2 };
        const matchesStatus = selectedStatus.length === 0 || 
            selectedStatus.some(name => item.status === statusMap[name]);

        // Lọc thông dụng: isCommonOnly là boolean | null
        const matchesCommon = isCommonOnly === null || item.isCommon === isCommonOnly;

        return matchesSearch && matchesLevel && matchesWordType && 
               matchesTopic && matchesStatus && matchesCommon;
    });

    // BƯỚC 2: SẮP XẾP
    if (!sortPriority) return result;

    // Phải return một mảng mới để trigger re-render
    return [...result].sort((a: any, b: any) => {
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        return sortPriority === 'asc' ? priorityA - priorityB : priorityB - priorityA;
    });
  }, [vocabList, searchTerm, selectedLevels, selectedWordTypes, selectedTopics, selectedStatus, isCommonOnly, sortPriority]);
  
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [vocabs, allTopics, allLevels, allWordTypes] = await Promise.all([
          vocabService.getAll(),
          vocabService.getTopics(),
          vocabService.getLevels(),
          vocabService.getWordTypes()
        ]);
        
        setVocabList(vocabs);
        setTopics(allTopics); 
        setLevels(allLevels);
        setWordTypes(allWordTypes);
      } catch (error) {
        console.error("Lỗi khởi tạo dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
          if (showFilter) {
              e.preventDefault();
          }
      };

      if (showFilter) {
          window.addEventListener('wheel', handleWheel, { passive: false });
          window.addEventListener('touchmove', handleWheel as any, { passive: false });
      }

      return () => {
          window.removeEventListener('wheel', handleWheel);
          window.removeEventListener('touchmove', handleWheel as any);
      };
  }, [showFilter]);

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      // Gọi service xóa (truyền uuid vào)
      await vocabService.delete(deleteId);

      // Cập nhật State: Dùng vocabID để lọc
      setVocabList(prev => prev.filter(item => item.vocabID !== deleteId));

      // Đóng modal
      setDeleteId(null);
      
      // Thông báo (tùy chọn)
      // toast.success("Xóa thành công!"); 
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Không thể xóa từ vựng này. Vui lòng thử lại!");
    }
  };

  const getLevelStyle = (level?: string) => {
    switch (level) {
      case 'N5': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'N4': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'N3': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'N2': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'N1': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
      <AdminHeader>
        <div className="flex items-center gap-197.5 w-full">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ TỪ VỰNG</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm từ vựng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <Link to="/admin/resource/vocabulary/create" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all no-underline shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm Từ vựng
            </Link>
          </div>
        </div>
      </AdminHeader>

      <div className="flex-1 overflow-y-auto p-8">
        {/* FILTER SYSTEM */}
        <div className="flex flex-col gap-4 mb-8 no-scrollbar">
            <div className="flex flex-wrap items-start gap-3">
                <div className="relative">
                    <button 
                        onClick={() => setShowFilter(!showFilter)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all border shadow-sm active:scale-95 ${
                            showFilter ? 'bg-primary text-white border-primary' : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                        Bộ lọc
                    </button>

                    {showFilter && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                            <div className="absolute top-full left-0 mt-3 w-396.25 h-auto bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.15)] border border-[#f4f0f2] p-8 z-20 animate-in fade-in zoom-in-95 duration-200">
                                
                                {/* Thanh điều hướng trang Menu */}
                                <div className="flex gap-4 mb-6 border-b border-[#f4f0f2] pb-2">
                                    <button 
                                        onClick={() => setFilterPage(1)}
                                        className={`pb-2 px-2 text-sm font-bold transition-all ${filterPage === 1 ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                                    >
                                        Cơ bản & Chủ đề
                                    </button>
                                    <button 
                                        onClick={() => setFilterPage(2)}
                                        className={`pb-2 px-2 text-sm font-bold transition-all ${filterPage === 2 ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                                    >
                                        Nhóm & Các loại
                                    </button>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {filterPage === 1 ? (
                                        <>
                                            {/* TRANG 1: Trình độ + Status + Chủ đề */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                        <span className="size-1.5 rounded-full bg-primary"></span> Trình độ
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['N5', 'N4', 'N3', 'N2', 'N1'].map(lv => (
                                                            <button key={lv} onClick={() => setSelectedLevels(prev => prev.includes(lv) ? prev.filter(x => x !== lv) : [...prev, lv])}
                                                                className={`px-4 py-2 rounded-xl text-[14px] font-bold border ${selectedLevels.includes(lv) ? 'bg-primary/10 text-primary border-primary/20' : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'}`}>
                                                                {lv}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                        <span className="size-1.5 rounded-full bg-green-500"></span> Trạng thái
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                      {[
                                                          { id: 'Public', name: 'Hoạt động', hoverClass: 'hover:border-green-500/50 hover:bg-green-50/50', activeClass: 'bg-green-50 text-green-600 border-green-200' },
                                                          { id: 'Draft', name: 'Đang sửa', hoverClass: 'hover:border-amber-500/50 hover:bg-amber-50/50', activeClass: 'bg-amber-50 text-amber-600 border-amber-200' },
                                                          { id: 'Archived', name: 'Lưu trữ', hoverClass: 'hover:border-red-500/50 hover:bg-red-50/50', activeClass: 'bg-red-100 text-red-600 border-red-300' }
                                                      ].map(st => (
                                                          <button 
                                                              key={st.id} 
                                                              onClick={() => setSelectedStatus(prev => prev.includes(st.name) ? prev.filter(x => x !== st.name) : [...prev, st.name])}
                                                              className={`px-4 py-2 rounded-xl text-[14px] font-bold border transition-all duration-200 ${
                                                                  selectedStatus.includes(st.name) 
                                                                  ? st.activeClass 
                                                                  : `bg-[#fbf9fa] text-[#2d2127] border-transparent ${st.hoverClass}`
                                                              }`}
                                                          >
                                                              {st.name}
                                                          </button>
                                                      ))}
                                                  </div>
                                                </div>
                                            </div>

                                            {/* Chủ đề */}
                                            <div className="border-t border-[#f4f0f2] pt-6">
                                                <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-amber-400"></span> Chủ đề từ vựng
                                                </h4>
                                                <div className="flex flex-wrap gap-2 max-h overflow-y-auto pr-2 custom-scrollbar">
                                                    {topics.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => {
                                                                setSelectedTopics(prev => 
                                                                    prev.includes(t.name) ? prev.filter(x => x !== t.name) : [...prev, t.name]
                                                                );
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-[14px] font-medium border ${
                                                                selectedTopics.includes(t.name)
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' 
                                                                : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                                            }`}
                                                        >
                                                            {t.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* PHẦN LỌC TỪ VỰNG */}
                                            <div className="flex flex-col gap-6">
                                                {/* 1. Loại từ */}
                                                <div>
                                                    <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                        <span className="size-1.5 rounded-full bg-indigo-500"></span> Loại từ
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                        {wordTypes.map((type) => (
                                                            <button 
                                                                key={type.name} 
                                                                onClick={() => setSelectedWordTypes(prev => 
                                                                    prev.includes(type.name) ? prev.filter(x => x !== type.name) : [...prev, type.name]
                                                                )}
                                                                className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-all ${
                                                                    selectedWordTypes.includes(type.name) 
                                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' 
                                                                    : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                                                }`}
                                                            >
                                                                {type.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 2. Hàng Thông dụng & Ưu tiên */}
                                                <div className="border-t border-[#f4f0f2] pt-8 mt-4">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                      
                                                      {/* Cụm Từ thông dụng */}
                                                      <div>
                                                        <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                            <span className="size-1.5 rounded-full bg-rose-500"></span> Thông dụng
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {[
                                                                { value: true, label: 'Từ thông dụng' },
                                                                { value: false, label: 'Từ hiếm gặp' }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.label}
                                                                    // Nếu đang chọn chính nó thì bấm lần nữa sẽ về null (hiện tất cả)
                                                                    onClick={() => setIsCommonOnly(isCommonOnly === opt.value ? null : opt.value)}
                                                                    className={`px-5 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
                                                                        isCommonOnly === opt.value 
                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm' 
                                                                        : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20 text-gray-500'
                                                                    }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                      {/* Cụm Sắp xếp Ưu tiên */}
                                                      <div>
                                                          <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                              <span className="size-1.5 rounded-full bg-amber-500"></span> Thứ tự ưu tiên
                                                          </h4>
                                                          <div className="flex flex-wrap gap-2">
                                                              {[
                                                                  { id: 'asc', label: 'Tăng dần', icon: '↑' },
                                                                  { id: 'desc', label: 'Giảm dần', icon: '↓' }
                                                              ].map(opt => (
                                                                  <button
                                                                      key={opt.id}
                                                                      onClick={() => setSortPriority(prev => prev === opt.id ? null : opt.id as any)}
                                                                      className={`px-5 py-2.5 rounded-xl text-[13px] font-medium border transition-all flex items-center gap-2 ${
                                                                          sortPriority === opt.id 
                                                                          ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' 
                                                                          : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20 text-gray-500'
                                                                      }`}
                                                                  >
                                                                      <span className="opacity-50">{opt.icon}</span>
                                                                      {opt.label}
                                                                  </button>
                                                              ))}
                                                          </div>
                                                      </div>

                                                  </div>
                                              </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* CÁC TAG ĐANG LỌC */}
                <div className="flex flex-wrap items-center gap-2 flex-1 pt-1 min-h-11.25">
                    {/* Tags Trình độ */}
                    {selectedLevels.map(lv => (
                        <div key={lv} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full animate-in zoom-in-90">
                            <span className="text-[14px] font-bold text-primary">{lv}</span>
                            <button onClick={() => setSelectedLevels(prev => prev.filter(x => x !== lv))} className="flex items-center text-primary hover:text-primary-dark">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    ))}

                    {/* Tags Nhóm loại từ */}
                    {selectedWordTypes.map(name => (
                        <div key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full animate-in zoom-in-90">
                            <span className="text-[14px] font-bold text-indigo-700">{name}</span>
                            <button 
                                onClick={() => setSelectedWordTypes(prev => prev.filter(x => x !== name))} 
                                className="flex items-center text-indigo-700 hover:text-indigo-900"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    ))}

                    {/* Tags Chủ đề */}
                    {selectedTopics.map(name => (
                      <div key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full animate-in zoom-in-90">
                          <span className="text-[14px] font-bold text-amber-700">{name}</span>
                          <button onClick={() => setSelectedTopics(prev => prev.filter(x => x !== name))} className="text-amber-700 hover:text-amber-900 flex">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                      </div>
                  ))}

                    {/* Nút Xóa tất cả */}
                    {(selectedLevels.length > 0 || selectedTopics.length > 0 || selectedWordTypes.length > 0 || selectedStatus.length > 0 || isCommonOnly !== null || sortPriority !== null) && (
                        <button 
                          onClick={() => { 
                              setSelectedLevels([]); 
                              setSelectedTopics([]); 
                              setSelectedWordTypes([]);
                              setSelectedStatus([]);
                              setIsCommonOnly(null);
                              setSortPriority(null);
                          }}
                          className="text-[12px] font-black uppercase tracking-wider text-[#886373] hover:text-red-500 px-3 py-1.5 transition-colors"
                      >
                          Xóa tất cả
                      </button>
                    )}
                </div>
            </div>
        </div>

        {deleteId && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
            {/* Overlay: Đồng bộ độ mờ và blur với bên Kanji */}
            <div 
              className="absolute inset-0 bg-[#181114]/30 backdrop-blur-sm animate-in fade-in duration-500" 
              onClick={() => setDeleteId(null)} 
            />
            
            {/* Modal Content: Giữ nguyên rounded-[3rem] và shadow đặc trưng */}
            <div className="relative bg-white rounded-[3rem] p-10 max-w-95 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.25)] border border-white/50 animate-in zoom-in-95 duration-300">
              
              {/* Vòng tròn hiển thị: Giữ nguyên style Kanji nhưng thay bằng Icon để hợp với từ dài */}
              <div className="relative size-32 rounded-full bg-linear-to-br from-[#fff5f5] to-[#fed7d7] flex flex-col items-center justify-center text-[#e53e3e] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(229,62,62,0.1)] border-4 border-white">
                <span className="text-3xl font-black font-japanese drop-shadow-sm">
                  {vocabToDelete?.word}
                </span>
                
                {/* Badge Delete: Giữ nguyên vị trí và màu sắc như bên Kanji */}
                <div className="absolute -bottom-1 -right-1 size-9 rounded-full bg-[#e53e3e] text-white flex items-center justify-center shadow-lg border-[3px] border-white">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </div>
              </div>
              
              {/* Văn bản thông báo: Cấu trúc y hệt bên Kanji */}
              <div className="text-center mb-10">
                <h3 className="text-[22px] font-black text-[#181114] mb-3 tracking-tight">Xác nhận xóa từ?</h3>
                <p className="text-[#886373] text-sm leading-relaxed px-2">
                  Từ vựng <span className="font-bold text-[#e53e3e] bg-[#fff5f5] px-2 py-0.5 rounded-md italic">"{vocabToDelete?.word}"</span> sẽ bị gỡ bỏ. <br/> Bạn chắc chắn chứ?
                </p>
              </div>
              
              {/* Nút bấm: Đồng bộ size 12px, font-black và màu sắc xám ấm/đỏ coral */}
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

        {/* --- GRID CARDS --- */}
        {loading ? (
          <div className="py-20 text-center text-[#886373] font-bold">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredVocabs.map((item) => (
              <div key={item.vocabID} className="group relative bg-white rounded-[2.5rem] border border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col aspect-[3/4.2] overflow-hidden">
                
                {/* Actions Overlay: Trượt từ dưới lên, nằm đè lên nội dung */}
                <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4 translate-y-20 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-50">
                  <Link 
                    to={`/admin/resource/vocabulary/edit/${item.vocabID}`} 
                    className="size-12 rounded-full bg-white shadow-2xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-primary hover:border-primary transition-all active:scale-90 no-underline"
                  >
                    <span className="material-symbols-outlined text-2xl">edit</span>
                  </Link>
                  <button 
                    onClick={() => setDeleteId(item.vocabID)} 
                    className="size-12 rounded-full bg-white shadow-2xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-red-500 hover:border-red-200 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-2xl">delete</span>
                  </button>
                </div>

                <div className="p-7 flex-1 flex flex-col items-center text-center">
                  {/* Header: Level & Topic nhỏ gọn */}
                  <div className="w-full flex justify-between items-start mb-6">
                    {/* Hiển thị Level */}
                    <span className={`px-2 py-0.5 text-[15px] font-bold rounded border ${getLevelStyle(item.levelName)}`}>
                      {item.levelName || 'N/A'}
                    </span>

                    {/* Hiển thị danh sách Hashtags cho Topics */}
                    <div className="flex justify-end max-w-[70%] items-center">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 text-primary text-[15px] font-bold rounded-lg truncate max-w-32 whitespace-nowrap italic">
                          {typeof item.topics[0] === 'string' ? item.topics[0] : (item.topics[0].topicName || item.topics[0].topicID)}
                        </span>

                        {item.topics.length > 1 && (
                          <div className="group relative flex items-center justify-center size-8 rounded-full bg-primary/10 border border-primary/20 text-primary transition-all duration-300">
                            
                            <span className="text-[15px] font-black">+{item.topics.length - 1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Word Content: Chữ siêu to cố định (Bỏ hover scale) */}
                  <div className="flex flex-col items-center mb-5">
                    <span className="text-primary text-[18px] font-japanese mb-1 font-bold italic tracking-wide">
                      {item.reading}
                    </span>
                    <span className="font-japanese text-[65px] font-black text-[#181114] tracking-tighter transition-colors duration-300">
                      {item.word}
                    </span>
                  </div>

                  <div className="w-12 h-1.5 bg-primary/10 rounded-full mb-6"></div>

                  {/* Meaning: Chữ lớn (16px) cố định */}
                  <div className="flex-1 flex items-start justify-center px-2">
                    <p className="text-[20px] font-bold text-[#5a434d] leading-relaxed line-clamp-3 italic">
                      "{item.meaning}"
                    </p>
                  </div>
                  
                  {/* Khoảng trống cố định để Overlay không che mất chữ quan trọng */}
                  <div className="h-10"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyListPage;