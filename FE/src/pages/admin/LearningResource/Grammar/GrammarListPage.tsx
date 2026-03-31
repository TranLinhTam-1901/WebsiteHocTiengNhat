import React, { useEffect, useState, useMemo } from 'react';
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

    // Thêm vào trong component GrammarListPage
    const [showFilter, setShowFilter] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [levels, setLevels] = useState<{id: string, name: string}[]>([]);
    const [topics, setTopics] = useState<{id: string, name: string}[]>([]);
    const [grammarGroups, setGrammarGroups] = useState<{id: string, name: string}[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [filterPage, setFilterPage] = useState<1 | 2>(1);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedFormality, setSelectedFormality] = useState<number[]>([]);

    const GRAMMAR_CATEGORIES = [
        { id: 0, name: 'Chung/Phức hợp' },
        { id: 1, name: 'Trợ từ' },
        { id: 2, name: 'Thể Te' },
        { id: 3, name: 'Thể Ta' },
        { id: 4, name: 'Thể Nai' },
        { id: 5, name: 'Thể Từ điển' },
        { id: 6, name: 'Kết thúc câu' },
        { id: 7, name: 'Liên từ' },
        { id: 8, name: 'Biến đổi tính từ' },
        { id: 9, name: 'So sánh' },
        { id: 10, name: 'Định ngữ' },
        { id: 11, name: 'Điều kiện' },
        { id: 12, name: 'Cho nhận' },
        { id: 13, name: 'Khả năng' },
        { id: 14, name: 'Tôn kính ngữ/Khiêm nhường ngữ' }
    ];

    const FORMALITY_LEVELS = [
        { id: 0, name: 'Trung tính' },
        { id: 1, name: 'Thân mật' },
        { id: 2, name: 'Lịch sự' },
        { id: 3, name: 'Trang trọng' },
        { id: 4, name: 'Tôn kính ngữ' },
        { id: 5, name: 'Khiêm nhường ngữ' },
    ];

    // Fetch Metadata khi mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [lvData, topicData, groupData] = await Promise.all([
                    grammarService.getLevels(),
                    grammarService.getTopics(),
                    grammarService.getGrammarGroups()
                ]);
                setLevels(lvData);
                setTopics(topicData);
                setGrammarGroups(groupData);
            } catch (error) {
                console.error("Lỗi tải metadata:", error);
            }
        };
        fetchMetadata();
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
    const filteredGrammars = useMemo(() => {
        if (grammars.length > 0) {
            console.log("Mẫu Topic từ danh sách:", grammars[0].topics);
            console.log("Mẫu Topic từ Filter:", topics[0]);
        }
        return grammars.filter((item: GrammarItem) => {
            // 1. Tìm kiếm theo tiêu đề hoặc cấu trúc
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                item.structure.toLowerCase().includes(searchTerm.toLowerCase());
            
            // 2. Lọc theo Trình độ (levelName là string: 'N5', 'N4'...)
            const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(item.levelName);
            
            // 3. Lọc theo Nhóm ngữ pháp (groupName)
            const matchesGroup = selectedGroups.length === 0 || 
                                (item.groupName && selectedGroups.includes(item.groupName));

            // 4. Lọc theo Chủ đề
            const matchesTopic = selectedTopics.length === 0 || 
            item.topics?.some(t => {
                return selectedTopics.some((selected: any) => {
                    const selectedId = typeof selected === 'object' ? selected.id : selected;
                    const topicId = typeof t === 'object' ? t.topicID : t;
                    return selectedId == topicId;
                });
            });

            // 5. Lọc theo Trạng thái (status: number)
            const statusMap: Record<string, number> = { 'Hoạt động': 1, 'Đang sửa': 0, 'Lưu trữ': 2 };
            const matchesStatus = selectedStatus.length === 0 || 
                                selectedStatus.some(name => item.status === statusMap[name]);

            // 6. Lọc theo Loại (Lúc này selectedCategories chứa [0, 1, 2...])
            const matchesCategory = selectedCategories.length === 0 || 
                                    selectedCategories.includes(item.grammarType);

            // 7. Lọc theo Độ trang trọng
            const matchesFormality = selectedFormality.length === 0 || 
                                    selectedFormality.includes(item.formality);
                                    
            // Kết hợp tất cả điều kiện (AND)
            return matchesSearch && matchesLevel && matchesGroup && 
                matchesTopic && matchesStatus && matchesCategory && matchesFormality;
        });
    }, [grammars, searchTerm, selectedLevels, selectedGroups, selectedTopics, selectedStatus, selectedCategories, selectedFormality]);

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
              <div className="flex items-center gap-191"> {/* Giữ nguyên gap-101 như bản gốc */}
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
                <div className="max-w-9xl mx-auto">
                    
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
                                                    <>
                                                        {/* TRANG 2: Loại ngữ pháp (Category) + Độ trang trọng (Formality) */}
                                                        <div>
                                                            <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                <span className="size-1.5 rounded-full bg-indigo-500"></span> Nhóm ngữ pháp
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2 h-auto max-h overflow-y-auto pr-2 custom-scrollbar">
                                                                {grammarGroups.map((group: any) => (
                                                                    <button key={group.id} onClick={() => setSelectedGroups(prev => prev.includes(group.name) ? prev.filter(x => x !== group.name) : [...prev, group.name])}
                                                                        className={`px-4 py-2 rounded-xl text-[14px] font-medium border ${selectedGroups.includes(group.name) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'}`}>
                                                                        {group.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Loại ngữ pháp */}
                                                        <div>
                                                            <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                <span className="size-1.5 rounded-full bg-purple-500"></span> Loại ngữ pháp
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2 h-auto max-h overflow-y-auto pr-2 custom-scrollbar">
                                                                {[
                                                                    { id: 0, name: 'Chung/Phức hợp' },
                                                                    { id: 1, name: 'Trợ từ' },
                                                                    { id: 2, name: 'Thể Te' },
                                                                    { id: 3, name: 'Thể Ta' },
                                                                    { id: 4, name: 'Thể Nai' },
                                                                    { id: 5, name: 'Thể Từ điển' },
                                                                    { id: 6, name: 'Kết thúc câu' },
                                                                    { id: 7, name: 'Liên từ' },
                                                                    { id: 8, name: 'Biến đổi tính từ' },
                                                                    { id: 9, name: 'So sánh' },
                                                                    { id: 10, name: 'Định ngữ' },
                                                                    { id: 11, name: 'Điều kiện' },
                                                                    { id: 12, name: 'Cho nhận' },
                                                                    { id: 13, name: 'Khả năng' },
                                                                    { id: 14, name: 'Tôn kính ngữ/Khiêm nhường ngữ' }
                                                                ].map(cat => (
                                                                    <button key={cat.id} onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(x => x !== cat.id) : [...prev, cat.id])}
                                                                        className={`px-4 py-2 rounded-xl text-[14px] font-medium border ${selectedCategories.includes(cat.id) ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'}`}>
                                                                        {cat.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Độ trang trọng */}
                                                        <div className="border-t border-[#f4f0f2] pt-6">
                                                            <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                <span className="size-1.5 rounded-full bg-green-400"></span> Độ trang trọng
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {[
                                                                    { id: 0, name: 'Trung tính' },
                                                                    { id: 1, name: 'Thân mật' },
                                                                    { id: 2, name: 'Lịch sự' },
                                                                    { id: 3, name: 'Trang trọng' },
                                                                    { id: 4, name: 'Tôn kính ngữ' },
                                                                    { id: 5, name: 'Khiêm nhường ngữ' }
                                                                ].map(f => (
                                                                    <button 
                                                                        key={f.id} 
                                                                        onClick={() => setSelectedFormality(prev => 
                                                                            prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                                                                        )}
                                                                        className={`px-4 py-2 rounded-xl text-[14px] font-medium border transition-all ${
                                                                            selectedFormality.includes(f.id) 
                                                                                ? 'bg-green-50 text-green-700 border-green-200 shadow-sm'
                                                                                : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                                                        }`}
                                                                    >
                                                                        {f.name}
                                                                    </button>
                                                                ))}
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

                                {/* MỚI - Tags Nhóm ngữ pháp */}
                                {selectedGroups.map(groupName => (
                                    <div key={groupName} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full animate-in zoom-in-90">
                                        <span className="text-[14px] font-bold text-indigo-700">{groupName}</span>
                                        <button onClick={() => setSelectedGroups(prev => prev.filter(x => x !== groupName))} className="flex items-center text-indigo-700 hover:text-indigo-900">
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

                                {/* Tags Loại ngữ pháp */}
                                {selectedCategories.map(catId => {
                                    // Tìm object tương ứng với ID
                                    const category = GRAMMAR_CATEGORIES.find(c => c.id === catId);
                                    return (
                                        <div key={catId} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full animate-in zoom-in-90">
                                            {/* Hiển thị category.name thay vì catId */}
                                            <span className="text-[14px] font-bold text-purple-700">
                                                {category ? category.name : catId}
                                            </span>
                                            <button 
                                                onClick={() => setSelectedCategories(prev => prev.filter(x => x !== catId))} 
                                                className="flex items-center text-purple-700 hover:text-purple-900"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Tags Độ trang trọng */}
                                {selectedFormality.map(fId => {
                                    const formality = FORMALITY_LEVELS.find(f => f.id === fId);
                                    return (
                                        <div key={fId} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full animate-in zoom-in-90">
                                            <span className="text-[14px] font-bold text-green-700">
                                                {formality ? formality.name : fId}
                                            </span>
                                            <button 
                                                onClick={() => setSelectedFormality(prev => prev.filter(x => x !== fId))} 
                                                className="flex items-center text-green-700 hover:text-green-900"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Nút Xóa tất cả */}
                                {(selectedLevels.length > 0 || selectedTopics.length > 0 || selectedGroups.length > 0 || selectedCategories.length > 0 || selectedFormality.length > 0 || selectedStatus.length > 0) && (
                                    <button 
                                        onClick={() => { 
                                            setSelectedLevels([]); 
                                            setSelectedTopics([]); 
                                            setSelectedGroups([]); 
                                            setSelectedCategories([]); 
                                            setSelectedFormality([]);
                                            setSelectedStatus([]);
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
                            {filteredGrammars.map((item) => (
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
                                                {/* Bố cục Grid chia 2 cột, cả 2 đều căn trái */}
                                                <div className="grid grid-cols-10 gap-4 mb-4 items-start">
                                                    
                                                    {/* Cột 1: Meaning (chiếm 4/10) */}
                                                    <div className="col-span-4">
                                                        <h4 className="text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                                                            Meaning
                                                        </h4>
                                                        <p className="text-[#181114] font-semibold text-base leading-snug">
                                                            {item.meaning}
                                                        </p>
                                                    </div>

                                                    {/* Cột 2: Topics (chiếm 6/10) */}
                                                    <div className="col-span-6 border-l border-[#f4f0f2] pl-4">
                                                        <h4 className="text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                                                            Topics
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.topics && item.topics.length > 0 ? (
                                                                <>
                                                                    {item.topics.slice(0, 3).map((t: any, index: number) => {
                                                                        const displayLabel = typeof t === 'object' ? (t.name || t.topicName) : t;
                                                                        return (
                                                                            <span 
                                                                                key={t.id || index} 
                                                                                className="px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded-md text-[12px] font-bold uppercase whitespace-nowrap"
                                                                            >
                                                                                {displayLabel}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {item.topics.length > 3 && (
                                                                        <span className="text-[12px] font-bold px-1.5 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded-md">
                                                                            +{item.topics.length - 3}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400 italic">None</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section Structure - Nằm toàn bộ chiều ngang phía dưới */}
                                                <h4 className="text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                                                    Structure
                                                </h4>
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