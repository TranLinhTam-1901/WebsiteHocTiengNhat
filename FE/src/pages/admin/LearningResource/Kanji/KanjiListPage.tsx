import React, { useEffect, useState, useMemo } from 'react';
import { kanjiService } from '../../../../services/Admin/kanjiService';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { KanjiItem, RadicalItem } from '../../../../interfaces/Admin/Kanji';

const KanjiListPage: React.FC = () => {
  // --- 1. KHAI BÁO TẤT CẢ STATE Ở ĐẦU ---
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState('Toàn bộ');
  const [strokeFilter, setStrokeFilter] = useState<number | 'all'>('all');
  
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  
  // Các state chứa dữ liệu từ API
  const [levels, setLevels] = useState<{id: string, name: string}[]>([]);
  const [topics, setTopics] = useState<{id: string, name: string}[]>([]);
  // Thêm cái này vào đầu Component
  const [radicals, setRadicals] = useState<RadicalItem[]>([]);
  const [selectedRadicals, setSelectedRadicals] = useState<string[]>([]);
  
  type FilterPageNumber = 1 | 2 | 3 | 4 | 5;
  const [filterPage, setFilterPage] = useState<FilterPageNumber>(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sửa lại hàm này để nó luôn có số để hiển thị
  const getStrokesForPage = () => {
      switch(filterPage) {
          case 2: return [1, 2, 3, 4];
          case 3: return [5, 6, 7, 8, 9];
          case 4: return [10, 11, 12, 13, 14];
          case 5: return [15, 16, 17];
          default: return [];
      }
  };

  const currentStrokes = getStrokesForPage();

  const groupedRadicals = useMemo(() => {
      return radicals.reduce((acc, rad) => {
          const s = rad.stroke || 0;
          if (!acc[s]) acc[s] = [];
          acc[s].push(rad);
          return acc;
      }, {} as Record<number, typeof radicals>);
  }, [radicals]);

  // --- 2. LOGIC LỌC DỮ LIỆU (Phải nằm sau khi khai báo State) ---
  const filteredList = kanjiList.filter((kanji) => {
    // 1. Search: Không đổi, nhưng thêm optional chaining
    const search = searchTerm.toLowerCase().trim();
    const matchSearch = search === "" || (
      (kanji.character?.toLowerCase().includes(search)) ||
      (kanji.meaning?.toLowerCase().includes(search)) ||
      (kanji.onyomi?.toLowerCase().includes(search)) ||
      (kanji.kunyomi?.toLowerCase().includes(search))
    );

    // 2. Level: Nếu là "Toàn bộ" thì cho qua, nếu không thì phải khớp
    const matchLevel = selectedLevel === 'Toàn bộ' || 
                      kanji.levelName === selectedLevel;

    // 3. Stroke: Chỉ lọc nếu strokeFilter khác 'all'
    const matchStroke = strokeFilter === 'all' || 
                      kanji.strokeCount === Number(strokeFilter);

    // 4. Lọc Nâng cao: Chỉ lọc nếu mảng CÓ PHẦN TỬ. Nếu mảng rỗng thì mặc định là True.
    const matchAdvancedLevel = selectedLevels.length === 0 || 
                              (kanji.levelName && selectedLevels.includes(kanji.levelName));
    
    const matchTopic = selectedTopics.length === 0 || 
                      (kanji.topicName && selectedTopics.includes(kanji.topicName));

    // 5. Lọc theo Trạng thái (status: number)
    const statusMap: Record<string, number> = { 'Hoạt động': 1, 'Đang sửa': 0, 'Lưu trữ': 2 };
    const matchesStatus = selectedStatus.length === 0 || 
                  selectedStatus.some(name => kanji.status === statusMap[name]);

    // 6. Lọc theo Bộ thủ (Thêm check optional chaining ?. để an toàn)
    const matchRadical = selectedRadicals.length === 0 || (
        kanji.radical?.id && selectedRadicals.includes(kanji.radical.id)
    );

    return matchSearch && matchLevel && matchStroke && matchAdvancedLevel && matchTopic && matchesStatus && matchRadical;
  });

  const kanjiToDelete = kanjiList.find(k => k.id === deleteId);

  // --- 3. CÁC HÀM GỌI API ---
  const fetchKanjis = async () => {
    try {
      setLoading(true);
      const res = await kanjiService.getAll();
      console.log("DỮ LIỆU THỰC TẾ TỪ API:", res);
      
      if (res.length === 0) {
        const fakeData: KanjiItem[] = [{
          id: "1",
          character: "日",
          meaning: "Mặt trời / Ngày",
          onyomi: "ニチ, ジツ",
          kunyomi: "ひ, -び",
          levelName: "N5",
          topicName: "Thời gian",
          strokeCount: 4,
          status: 1,
          updatedAt: new Date().toISOString(),
          
          // --- SỬA Ở ĐÂY: Bọc thông tin bộ thủ vào object 'radicals' ---
          radical: {
            id: "r1",
            character: "日",
            name: "Nhật",
            stroke: 4
          }
          // ----------------------------------------------------------
        }];
        setKanjiList(fakeData);
      } else {
        setKanjiList(res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [topicData, levelData, radicalData] = await Promise.all([
        kanjiService.getTopics(),
        kanjiService.getLevels(),
        kanjiService.getRadicals() // Giả sử service của ông có hàm này
      ]);
      
      setTopics(topicData || []);
      setLevels(levelData || []);
      setRadicals(radicalData || []); // Đổ dữ liệu vào đây
    } catch (error) {
      console.error("Lỗi lấy dữ liệu lọc:", error);
    }
  };

  // --- 4. USEEFFECT (Nằm riêng biệt) ---
  useEffect(() => {
    fetchKanjis();
    fetchFilters();
  }, []);

  // Debug để xem dữ liệu đã vào state chưa
  useEffect(() => {
    console.log("Topics hiện tại trong State:", topics);
  }, [topics]);

    const handleDelete = async (id: string) => {
    try {
        await kanjiService.delete(id); // Giả sử service của bạn có hàm delete
        setKanjiList(prev => prev.filter(k => k.id !== id));
        setDeleteId(null);
        // Thêm thông báo thành công nếu muốn
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
    }
  };

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

  const getLevelStyle = (level: string) => {
  switch (level) {
      case 'N5': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'N4': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'N3': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'N2': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'N1': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  // 4. Hiển thị trạng thái Loading
  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
    <AdminHeader>
      <div className="flex items-center gap-210">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ KANJI</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm kanji, nghĩa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>

          {/* Add Button */}
          <Link 
            to="/admin/resource/kanji/create" // Thay đường dẫn này bằng route thực tế của bạn
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm Kanji
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
                                    {[
                                        { id: 1, label: 'Cơ bản & Chủ đề' },
                                        { id: 2, label: 'Bộ thủ 1 - 4' },
                                        { id: 3, label: 'Bộ thủ 5 - 9' },
                                        { id: 4, label: 'Bộ thủ 10 - 14' },
                                        { id: 5, label: 'Bộ thủ 15 - 17' }
                                    ].map((page) => (
                                        <button 
                                            key={page.id}
                                            onClick={() => setFilterPage(page.id as FilterPageNumber)}
                                            className={`pb-2 px-2 text-sm font-bold transition-all border-b-2 ${
                                                filterPage === page.id 
                                                ? 'text-primary border-primary' 
                                                : 'text-gray-400 border-transparent'
                                            }`}
                                        >
                                            {page.label}
                                        </button>
                                    ))}
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
                                                    <span className="size-1.5 rounded-full bg-amber-400"></span> Chủ đề ngữ pháp
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
                                        <div className="flex flex-col gap-6 max-h-120 pr-2 custom-scrollbar">
                                            {currentStrokes.map(stroke => (
                                                <div key={stroke} className="flex gap-4 mb-2">
                                                    {/* Luôn hiện số nét để người dùng biết đang ở đâu */}
                                                    <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[#fbf9fa] border border-[#f4f0f2] text-[15px] font-black text-[#886373]">
                                                        {stroke}
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* Nếu có bộ thủ thì render, không thì hiện loading nhẹ hoặc để trống */}
                                                        {groupedRadicals[stroke] && groupedRadicals[stroke].length > 0 ? (
                                                            groupedRadicals[stroke].map(rad => (
                                                                <button 
                                                                    key={rad.id}
                                                                    onClick={() => {
                                                                        setSelectedRadicals(prev => 
                                                                          prev.includes(rad.id) ? prev.filter(x => x !== rad.id) : [...prev, rad.id]
                                                                        );
                                                                    }}
                                                                    className={`px-4 py-2 rounded-xl text-[14px] border transition-all duration-200 ${
                                                                        selectedRadicals.includes(rad.name)
                                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
                                                                        : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                                                    }`}
                                                                >
                                                                    <span className="font-japanese text-[20px]">{rad.character}</span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-gray-300 mt-2">Đang tải...</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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

                    {/* Tags Chủ đề */}
                    {selectedTopics.map(topicName => (
                        <div key={topicName} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full animate-in zoom-in-90">
                            <span className="text-[14px] font-bold text-amber-700">{topicName}</span>
                            <button onClick={() => setSelectedTopics(prev => prev.filter(x => x !== topicName))} className="text-amber-700 hover:text-amber-900 flex">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    ))}

                    {/* Tags Bộ thủ */}
                    {selectedRadicals.map(radId => {
                        // Tìm đối tượng bộ thủ từ ID để lấy Character và Name
                        const radInfo = radicals.find(r => r.id === radId);
                        if (!radInfo) return null;

                        return (
                            <div key={radId} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full animate-in zoom-in-90">
                                {/* Hiện chữ Kanji to, rõ */}
                                <span className="font-japanese text-[18px] text-indigo-700 leading-none">
                                    {radInfo.character}
                                </span>
                                {/* Hiện tên bộ thủ nhỏ bên cạnh */}
                                <span className="text-[15px] font-bold text-indigo-500/80 border-l border-indigo-200 pl-1.5 ml-0.5">
                                    {radInfo.name}
                                </span>
                                
                                <button 
                                    onClick={() => setSelectedRadicals(prev => prev.filter(x => x !== radId))} 
                                    className="text-indigo-400 hover:text-indigo-700 flex ml-1 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        );
                    })}

                    {/* Nút Xóa tất cả */}
                    {(selectedLevels.length > 0 || selectedTopics.length > 0 || selectedStatus.length > 0 || selectedRadicals.length > 0) && (
                        <button 
                            onClick={() => { 
                                setSelectedLevels([]); 
                                setSelectedTopics([]); 
                                setSelectedStatus([]);
                                setSelectedRadicals([]);
                            }}
                            className="text-[12px] font-black uppercase tracking-wider text-[#886373] hover:text-red-500 px-3 py-1.5 transition-colors"
                        >
                            Xóa tất cả
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#fbf9fa] border border-[#f4f0f2] rounded-full px-4 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <span className="material-symbols-outlined text-[16px] text-[#886373] mr-2">draw</span>
              <input 
                type="number" 
                placeholder="Số nét"
                value={strokeFilter === 'all' ? '' : strokeFilter}
                onChange={(e) => setStrokeFilter(e.target.value ? parseInt(e.target.value) : 'all')}
                className="w-14 bg-transparent text-[15px] font-bold text-[#181114] outline-none no-spinner placeholder:text-[#886373]/50 placeholder:font-normal"
              />
            </div>

            {/* Nút Reset */}
            <button 
              onClick={() => { setSelectedLevel('Toàn bộ'); setStrokeFilter('all'); }}
              className="size-9 flex items-center justify-center bg-white text-[#886373] border border-[#f4f0f2] rounded-full hover:text-red-500 hover:border-red-200 transition-all active:scale-90 shadow-sm"
              title="Xóa lọc"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list_off</span>
            </button>
          </div>
            </div>
        </div>

        {/* POPUP ĐẶT Ở ĐÂY (Ngoài grid, ngoài card) */}
        {deleteId && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
            {/* Overlay: Làm mờ hậu cảnh sâu hơn và mịn hơn */}
            <div 
              className="absolute inset-0 bg-[#181114]/30 backdrop-blur-sm animate-in fade-in duration-500" 
              onClick={() => setDeleteId(null)} 
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-[3rem] p-10 max-w-95 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.25)] border border-white/50 animate-in zoom-in-95 duration-300">
              
              {/* Vòng tròn hiển thị chữ Kanji: Mix màu Soft Rose và Soft Red */}
              <div className="relative size-28 rounded-full bg-linear-to-br from-[#fff5f5] to-[#fed7d7] flex flex-col items-center justify-center text-[#e53e3e] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(229,62,62,0.1)] border-4 border-white">
                <span className="text-5xl font-black font-japanese drop-shadow-sm">
                  {kanjiToDelete?.character}
                </span>
                
                {/* Badge Delete nhỏ nhắn, xinh xắn hơn */}
                <div className="absolute -bottom-1 -right-1 size-9 rounded-full bg-[#e53e3e] text-white flex items-center justify-center shadow-lg border-[3px] border-white">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </div>
              </div>
              
              {/* Văn bản: Sử dụng font-spacing và màu sắc trung tính */}
              <div className="text-center mb-10">
                <h3 className="text-[22px] font-black text-[#181114] mb-3 tracking-tight">Xác nhận xóa dữ liệu?</h3>
                <p className="text-[#886373] text-sm leading-relaxed px-2">
                  Mọi thông tin về chữ <span className="font-bold text-[#e53e3e] bg-[#fff5f5] px-2 py-0.5 rounded-md italic">"{kanjiToDelete?.character}"</span> sẽ bị xóa. Thao tác này không thể hoàn tác.
                </p>
              </div>
              
              {/* Nút bấm: Bo góc mạnh và hiệu ứng Hover mượt */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#f4f2f3] text-[#5a434d] font-black text-[12px] uppercase tracking-wider hover:bg-[#ece8ea] hover:text-[#181114]transition-all duration-200 active:scale-95 border border-[#e8e4e6]"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#e53e3e] text-white font-black text-[12px] uppercase tracking-wider hover:bg-[#c53030] shadow-xl shadow-red-100 hover:shadow-red-200 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid hiển thị dữ liệu thật */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredList.map((kanji) => (
            <div key={kanji.id} className="group relative bg-white rounded-4xl border border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 flex flex-col aspect-[3/4.5] overflow-hidden">
              
              {/* Actions Overlay */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 translate-x-14 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
                <Link to={`/admin/resource/kanji/edit/${kanji.id}`} className="size-12 rounded-full bg-white shadow-xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-primary hover:border-primary transition-all active:scale-90">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </Link>
                <button 
                  onClick={() => setDeleteId(kanji.id)} 
                  className="size-12 rounded-full bg-white shadow-xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-red-500 hover:border-red-200 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>

              {/* Kanji Card Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[15px] font-bold rounded border ${getLevelStyle(kanji.levelName)}`}>
                    {kanji.levelName || "N/A"}
                  </span>
                  <div className="text-[15px] text-[#886373] font-medium text-right mt-1">
                    Radical: 
                    <span 
                      className="font-japanese text-primary ml-1" 
                      title={kanji.radical?.name || "N/A"} 
                    >
                      {kanji.radical?.character || '？'} 
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="flex flex-col items-center gap-1 mb-4">
                    <span className="text-[22px] text-primary font-japanese tracking-tighter">{kanji?.character}</span>
                    <span className="text-7xl font-japanese font-bold text-[#181114] group-hover:scale-105 transition-transform duration-500">
                      {kanji?.character}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 w-full text-center">
                    <p className="text-[15px] font-japanese text-[#181114]">On: {kanji?.onyomi || '---'}</p>
                    <p className="text-[15px] font-japanese text-[#181114]">Kun: {kanji?.kunyomi || '---'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#f4f0f2] text-center">
                  <p className="text-[18px] font-bold text-[#181114]">{kanji?.meaning || "Chưa có nghĩa"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default KanjiListPage;