import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { kanjiService } from '../../../../services/Admin/kanjiService';
import { vocabService } from '../../../../services/Admin/vocabService';
import { CreateUpdateKanjiDTO } from '../../../../interfaces/Admin/Kanji';

const KanjiEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const API_URL = "https://localhost:7055";

    // 1. Khởi tạo State (Không set cứng ID, để trống để người dùng chọn)
    const [formData, setFormData] = useState<CreateUpdateKanjiDTO>({
        character: '',
        onyomi: '',
        kunyomi: '',
        meaning: '',
        strokeCount: 0,
        strokeGif: '',
        radical: '',
        mnemonics: '',
        popularity: 0,
        note: '',
        status: 1,
        levelID: '', 
        topicID: '', 
        lessonID: '' 
    });

    // 2. Load dữ liệu khi ở chế độ Edit
    useEffect(() => {
        if (isEditMode && id) {
            const fetchKanji = async () => {
                try {
                    const data = await kanjiService.getById(id);
                    
                    // 1. Cập nhật toàn bộ form
                    setFormData(data);

                    // 2. Cập nhật chữ hiển thị trên nút Dropdown (Rất quan trọng)
                    const statusLabel = data.status === 0 ? "Draft" : data.status === 2 ? "Archived" : "Published";
                    setVisibility(statusLabel);

                } catch (error) {
                    console.error("Lỗi khi lấy dữ liệu Kanji:", error);
                    alert("Không thể tải dữ liệu Kanji này.");
                }
            };
            fetchKanji();
        }
    }, [id, isEditMode]);

    // 3. Xử lý thay đổi dữ liệu input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (parseInt(value) || 0) : value
        }));
    };

    // 4. Xử lý lưu dữ liệu
    const handleSave = async () => {
        const vocabIdsOnly = formData.relatedVocabs?.map((v: any) => v.vocabID) || [];

        // 2. Tạo bản sao dữ liệu để gửi đi
        const { relatedVocabs, ...restData } = formData as any; // Tách mảng object ra để không gửi lên dư thừa

        const finalData = {
            ...restData,
            status: formData.status,
            RelatedVocabIDs: vocabIdsOnly 
        };

        console.log("Dữ liệu thực tế gửi lên API:", finalData);

        try {
            if (isEditMode && id) {
                await kanjiService.update(id, finalData);
                alert("Cập nhật Kanji thành công!");
            } else {
                await kanjiService.create(finalData);
                alert("Thêm mới Kanji thành công!");
            }
            navigate('/admin/resource/kanji');
        } catch (error: any) {
            // Log chi tiết lỗi từ Server trả về (đây là chìa khóa để biết 400 ở đâu)
            console.error("Server trả về lỗi 400:", error.response?.data);
            alert("Lỗi dữ liệu: " + JSON.stringify(error.response?.data?.errors || error.response?.data));
        }
    };

    // 1. State quản lý
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [tempVocab, setTempVocab] = useState({ vocabID: '', word: '', reading: '', meaning: '' });
    
    // 2. CHỈ GIỮ LẠI 1 HÀM resetAddState DUY NHẤT
    const resetAddState = () => {
        setIsAdding(false);
        setSearchQuery("");
        setSearchResults([]);
        setTempVocab({vocabID: '', word: '', reading: '', meaning: '' });
    };

    // 3. Logic tìm kiếm (Sửa lỗi searchByKanji bằng cách dùng filter tạm thời nếu BE chưa có)
    useEffect(() => {
        if (isAdding) {
            const query = searchQuery || formData.character;
            if (query) {
                const fetchSuggestions = async () => {
                    try {
                        const all = await vocabService.getAll(); 
                        const filtered = all.filter(v => v.word.includes(query));
                        setSearchResults(filtered.slice(0, 5)); // Lấy 5 kết quả đầu
                    } catch (e) { 
                        console.error("Lỗi fetch gợi ý:", e); 
                    }
                };
                fetchSuggestions();
            }
        }
    }, [isAdding, searchQuery, formData.character]);

    // 4. Hàm thêm từ có sẵn (Đã sửa lỗi thiếu trường reading)
    const selectVocabFromDB = (v: any) => {
        setTempVocab({ 
            vocabID: v.vocabID, // Lưu ID thật từ DB
            word: v.word, 
            reading: v.reading || '', 
            meaning: v.meaning 
        });
        setSearchResults([]); // Đóng dropdown gợi ý
        setSearchQuery("");   // Xóa text trong ô search
    };

    // Nút "Lưu từ vựng" (Xác nhận từ Preview đưa vào danh sách chính)
    const saveManualVocab = () => {
        // Kiểm tra xem đã có vocabID từ DB chưa
        if (!tempVocab.vocabID) {
            alert("Vui lòng chọn một từ vựng từ danh sách gợi ý phía trên!");
            return;
        }

        // Kiểm tra trùng lặp trong danh sách đã thêm
        const isExisted = formData.relatedVocabs?.some(v => v.vocabID === tempVocab.vocabID);
        if (isExisted) {
            alert("Từ vựng này đã có trong danh sách liên kết!");
            return;
        }

        // Cập nhật vào danh sách chính
        setFormData(prev => ({
            ...prev,
            relatedVocabs: [...(prev.relatedVocabs || []), { ...tempVocab }]
        }));

        // Reset trạng thái để thêm từ tiếp theo hoặc đóng form
        resetAddState();
    };

    // 6. Hàm xóa
    const handleRemoveVocab = (vocabID: string) => {
        setFormData({
            ...formData,
            relatedVocabs: formData.relatedVocabs?.filter(v => v.vocabID !== vocabID)
        });
    };

    // 1. Khai báo thêm State để lưu danh sách từ DB
    const [metadata, setMetadata] = useState({
        levels: [] as any[],
        topics: [] as any[],
        lessons: [] as any[]
    });

    // 2. Fetch data khi component mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Sử dụng Promise.all để gọi đồng thời 3 hàm từ Service
                const [levels, topics, lessons] = await Promise.all([
                    kanjiService.getLevels(),
                    kanjiService.getTopics(),
                    kanjiService.getLessons()
                ]);
                
                // Vì trong Service bạn đã return response.data nên ở đây ta nhận trực tiếp data luôn
                setMetadata({ levels, topics, lessons });
            } catch (e) { 
                console.error("Lỗi khi tải Metadata:", e); 
            }
        };
        fetchMetadata();
    }, []);

    // 1. Thêm State để quản lý việc tìm kiếm Topic
    const [topicSearch, setTopicSearch] = useState('');
    const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
    const filteredTopics = metadata.topics.filter(t => 
      t.name.toLowerCase().includes(topicSearch.toLowerCase())
    );
    const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);
    const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
    const [visibility, setVisibility] = useState('Published');

    const [dropUp, setDropUp] = useState({ lesson: false, visibility: false });

    const handleOpenDropdown = (type: 'lesson' | 'visibility', e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const isCloseToBottom = windowHeight - rect.bottom < 500;
    
    setDropUp(prev => ({ ...prev, [type]: isCloseToBottom }));
      if(type === 'lesson') setIsLessonMenuOpen(!isLessonMenuOpen);
      if(type === 'visibility') setIsVisibilityMenuOpen(!isVisibilityMenuOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* --- Header Section --- */}
                <AdminHeader>
                    <div className={isEditMode ? 'flex items-center w-full gap-260' : 'flex items-center w-full gap-274'}>
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                onClick={() => navigate(-1)}
                                className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-[#181114] uppercase">
                                    {isEditMode ? 'Chỉnh sửa Kanji' : 'Thêm Kanji'}
                                </h2>
                                <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                    <span>Quản lý</span>
                                    <span>/</span>
                                    <span className="text-primary font-bold">{isEditMode ? 'Chỉnh sửa' : 'Thêm mới'}</span>
                                </nav>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleSave}
                                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                            >
                                <span className="material-symbols-outlined text-sm">save</span>
                                {isEditMode ? 'Cập nhật' : 'Lưu Kanji'}
                            </button>
                        </div>
                    </div>
                </AdminHeader>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left & Middle Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Core Kanji Info */}
                            <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
                                <div className="flex gap-8">
                                    <div className="shrink-0">
                                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Kanji</label>
                                        <input
                                            name="character"
                                            value={formData.character}
                                            onChange={handleInputChange}
                                            className="size-32 text-center text-6xl font-japanese border-2 border-dashed border-[#f4f0f2] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-[#181114]"
                                            maxLength={1}
                                            placeholder="新"
                                            type="text"
                                        />
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Stroke Count</label>
                                            <input
                                                name="strokeCount"
                                                value={formData.strokeCount}
                                                onChange={handleInputChange}
                                                className="w-full bg-[#fbf9fa] border-[#f4f0f2] border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                placeholder="13"
                                                type="number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Radical</label>
                                            <input
                                                name="radical"
                                                value={formData.radical}
                                                onChange={handleInputChange}
                                                className="w-full bg-[#fbf9fa] border-[#f4f0f2] border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-japanese"
                                                placeholder="斤"
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">JLPT Level</label>
                                            <div className="flex gap-2">
                                                {/* Lưu ý: Bạn cần thay các ID này bằng ID thực tế trong DB của bạn */}
                                                {[
                                                    { label: 'N5', id: '550e8400-e29b-41d4-a716-446655440000' },
                                                    { label: 'N4', id: '550e8400-e29b-41d4-a716-446655440001' },
                                                    { label: 'N3', id: '550e8400-e29b-41d4-a716-446655440002' },
                                                    { label: 'N2', id: '550e8400-e29b-41d4-a716-446655440003' },
                                                    { label: 'N1', id: '550e8400-e29b-41d4-a716-446655440004' }
                                                ].map((level) => (
                                                    <label key={level.label} className="flex-1">
                                                        <input
                                                            className="hidden peer"
                                                            name="levelID"
                                                            type="radio"
                                                            value={level.id}
                                                            checked={formData.levelID === level.id}
                                                            onChange={handleInputChange}
                                                        />
                                                        <div className="text-center py-2 rounded-lg border border-[#f4f0f2] text-xs font-bold text-[#886373] cursor-pointer peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all">
                                                            {level.label}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Readings & Meanings */}
                            <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">On-yomi</label>
                                        <input
                                            name="onyomi"
                                            value={formData.onyomi}
                                            onChange={handleInputChange}
                                            className="w-full bg-[#fbf9fa] border-[#f4f0f2] border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-japanese"
                                            placeholder="シン"
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Kun-yomi</label>
                                        <input
                                            name="kunyomi"
                                            value={formData.kunyomi}
                                            onChange={handleInputChange}
                                            className="w-full bg-[#fbf9fa] border-[#f4f0f2] border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-japanese"
                                            placeholder="あたら.しい"
                                            type="text"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Meaning (English/Vietnamese)</label>
                                    <textarea
                                        name="meaning"
                                        value={formData.meaning}
                                        onChange={handleInputChange}
                                        className="w-full bg-[#fbf9fa] border-[#f4f0f2] border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                        placeholder="Nghĩa của từ..."
                                        rows={3}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Tạm thời giữ nguyên phần Vocabulary UI */}
                            <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-[#886373]">Related Vocabulary</h3>
                                    </div>
                                    {!isAdding && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsAdding(true);
                                                setTempVocab(prev => ({ ...prev, word: formData.character }));
                                            }}
                                            className="group flex items-center gap-2 bg-primary/5 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                                        >
                                            <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-90">add</span>
                                            Add Word
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* --- DANH SÁCH TỪ ĐÃ THÊM --- */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {formData.relatedVocabs?.map((vocab) => (
                                            <div 
                                                key={vocab.vocabID} 
                                                className="flex items-center justify-between p-3 rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] group hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    {/* Phần Icon/Chữ Nhật: Giữ kích thước cố định */}
                                                    <div className="shrink-0 size-18 rounded-xl bg-white border border-[#f4f0f2] flex items-center justify-center font-japanese font-bold text-black shadow-sm text-lg group-hover:scale-105 transition-transform">
                                                        {vocab.word}
                                                    </div>

                                                    {/* Phần nội dung: Tự động co giãn và xử lý text dài */}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[12px] text-[#886373] font-semibold tracking-wider uppercase truncate">
                                                            {vocab.reading || 'Reading'}
                                                        </span>
                                                        <span className="text-sm text-[#181114] truncate leading-tight mt-0.5">
                                                            {vocab.meaning}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Nút xóa: Hiện rõ hơn khi hover vào card */}
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveVocab(vocab.vocabID)}
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 ml-2 size-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                                                    title="Remove"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* --- KHUNG NHẬP LIỆU NÂNG CAO --- */}
                                    {isAdding && (
                                        <div className="relative p-5 rounded-2xl border-2 border-primary/10 bg-linear-to-b from-primary/3 to-transparent animate-in zoom-in-95 duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Cột trái: Nhập liệu */}
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <label className="text-[12px] font-black uppercase text-[#886373] ml-1">Word / Search</label>
                                                        <input 
                                                            readOnly
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Từ vựng (VD: 新聞)"
                                                            className="w-full bg-white border border-[#f4f0f2] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 font-japanese font-bold"
                                                            value={tempVocab.word}
                                                            onChange={(e) => {
                                                                setTempVocab({...tempVocab, word: e.target.value});
                                                                setSearchQuery(e.target.value);
                                                            }}
                                                        />
                                                        
                                                        {/* Suggestions Dropdown */}
                                                        {searchResults.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-xl mt-2 overflow-hidden">
                                                                <div className="bg-[#fbf9fa] px-3 py-1.5 border-b border-[#f4f0f2] text-[12px] font-bold text-[#886373] uppercase">Gợi ý từ hệ thống</div>
                                                                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                                                    {searchResults.map(v => (
                                                                        <div 
                                                                            key={v.vocabID}
                                                                            onClick={() => {
                                                                                selectVocabFromDB(v);
                                                                            }}
                                                                            className="px-4 py-2.5 text-xs hover:bg-primary/5 cursor-pointer flex justify-between items-center group/item border-b border-[#f4f0f2]/50 last:border-none"
                                                                        >
                                                                            <div>
                                                                                <span className="font-bold font-japanese text-sm">{v.word}</span>
                                                                                <span className="ml-2 text-[12px] text-[#886373]">({v.reading})</span>
                                                                            </div>
                                                                            <span className="material-symbols-outlined text-xs text-primary opacity-0 group-hover/item:opacity-100 transition-all">check_circle</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="text-[12px] font-black uppercase text-[#886373] ml-1">Reading</label>
                                                        <input 
                                                            readOnly
                                                            type="text"
                                                            placeholder="Cách đọc (VD: しんぶん)"
                                                            className="w-full bg-white border border-[#f4f0f2] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                                                            value={tempVocab.reading}
                                                            onChange={(e) => setTempVocab({...tempVocab, reading: e.target.value})}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[12px] font-black uppercase text-[#886373] ml-1">Meaning</label>
                                                        <input
                                                            readOnly
                                                            type="text"
                                                            placeholder="Ý nghĩa"
                                                            className="w-full bg-white border border-[#f4f0f2] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                                                            value={tempVocab.meaning}
                                                            onChange={(e) => setTempVocab({...tempVocab, meaning: e.target.value})}
                                                        />
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <button 
                                                            type="button"
                                                            onClick={saveManualVocab}
                                                            className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                        >
                                                            Lưu từ vựng
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={resetAddState}
                                                            className="px-4 py-2 rounded-xl text-sm font-bold text-[#886373] hover:bg-[#f4f0f2] transition-all"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Cột phải: Preview Card */}
                                                <div className="hidden md:flex flex-col items-center justify-center border-l border-[#f4f0f2] pl-4">
                                                    <p className="text-[12px] font-black text-[#886373] uppercase mb-3">Preview</p>
                                                    <div className="w-full p-4 rounded-2xl bg-white border border-[#f4f0f2] shadow-sm flex flex-col items-center text-center">
                                                        <div className="text-[12px] text-[#886373] mb-2">{tempVocab.reading || '...'}</div>
                                                        <div className="text-2xl font-japanese font-bold text-black mb-1">{tempVocab.word || '?'}</div>
                                                        <div className="text-xs font-bold text-[#886373] italic line-clamp-2">{tempVocab.meaning || 'Nghĩa của từ'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(!formData.relatedVocabs || formData.relatedVocabs.length === 0) && !isAdding && (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-[#f4f0f2] rounded-2xl bg-[#fbf9fa]">
                                            <span className="material-symbols-outlined text-3xl text-[#f4f0f2] mb-2">menu_book</span>
                                            <p className="text-[15px] text-[#886373] font-medium italic">Chưa có từ vựng nào được liên kết.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Stroke Preview */}
                            <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm">
                              <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-4">
                                Stroke Order Preview
                              </label>
                              
                              <div className="aspect-square w-full rounded-xl bg-[#fbf9fa] border-2 border-dashed border-[#f4f0f2] flex items-center justify-center relative overflow-hidden group transition-all hover:border-primary/50">
                                
                                {formData.strokeGif ? (
                                  // Trường hợp đã có ảnh/gif
                                  <div className="relative w-full h-full p-4 flex items-center justify-center">
                                    <img 
                                      src={
                                        formData.strokeGif.startsWith('data:') 
                                          ? formData.strokeGif                   // Nếu là ảnh mới đang upload (base64)
                                          : `${API_URL}${formData.strokeGif}`    // Nếu là ảnh lấy từ database (đường dẫn /uploads/...)
                                      } 
                                      alt="Preview" 
                                      className="max-w-full max-h-full object-contain mix-blend-multiply"
                                      onError={(e) => {
                                        // Nếu vẫn lỗi, thử xóa mix-blend-multiply để kiểm tra
                                        console.error("Không thể tải ảnh từ:", e.currentTarget.src);
                                      }}
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setFormData({ ...formData, strokeGif: '' })}
                                      className="absolute top-2 right-2 size-8 bg-white shadow-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
                                    >
                                      <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                  </div>
                                ) : (
                                  // Trường hợp trống - Hiện chữ mờ và nút upload
                                  <>
                                    <span className="font-japanese text-[120px] text-[#181114] opacity-[0.03] select-none">
                                      {formData.character || '新'}
                                    </span>
                                    
                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/gif, image/png, image/jpg"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setFormData({ ...formData, strokeGif: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                      <div className="size-14 rounded-full bg-white shadow-sm border border-[#f4f0f2] flex items-center justify-center text-[#886373] group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                                        <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                                      </div>
                                      <p className="mt-2 text-[10px] font-bold text-[#886373] opacity-60">UPLOAD GIF</p>
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6">
                              {/* 1. SECTION TOPIC (Giữ nguyên logic Searchable của bạn) */}
                              <div>
                                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-3">Topic Assignment</label>
                                  <div className="relative">
                                      <div className="relative">
                                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">search</span>
                                          <input 
                                              type="text"
                                              placeholder="Tìm và chọn Topic..."
                                              value={topicSearch}
                                              onChange={(e) => { setTopicSearch(e.target.value); setIsTopicMenuOpen(true); }}
                                              onFocus={() => setIsTopicMenuOpen(true)}
                                              className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                          />
                                      </div>
                                      {isTopicMenuOpen && (
                                          <>
                                              <div className="fixed inset-0 z-10" onClick={() => setIsTopicMenuOpen(false)} />
                                              <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                  {filteredTopics.map(t => (
                                                      <button key={t.id} onClick={() => { setFormData({ ...formData, topicID: t.id }); setTopicSearch(''); setIsTopicMenuOpen(false); }}
                                                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between group">
                                                          {t.name}
                                                          <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">add</span>
                                                      </button>
                                                  ))}
                                              </div>
                                          </>
                                      )}
                                  </div>
                                  {/* Tag Topic hiển thị bên dưới */}
                                  <div className="mt-3 min-h-8">
                                      {formData.topicID && (
                                          <div className="inline-flex group relative">
                                              <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[11px] font-bold rounded-full flex items-center">
                                                  <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">label</span>
                                                  {metadata.topics.find(t => t.id === formData.topicID)?.name}
                                              </div>
                                              <button onClick={() => setFormData({ ...formData, topicID: '' })}
                                                  className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100">
                                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                              </button>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {/* 2. SECTION LESSON */}
                              <div className="pt-5 border-t border-[#f4f0f2]">
                                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Lesson Assign</label>
                                  <div className="relative">
                                      <button 
                                          onClick={(e) => handleOpenDropdown('lesson', e)}
                                          className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                                      >
                                          <span className={formData.lessonID ? "text-[#181114]" : "text-[#886373]/60"}>
                                              {metadata.lessons.find(l => l.id === formData.lessonID)?.name || "-- Chọn bài học --"}
                                          </span>
                                          <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isLessonMenuOpen ? 'rotate-180' : ''}`}>
                                              expand_more
                                          </span>
                                      </button>

                                      {isLessonMenuOpen && (
                                          <>
                                              <div className="fixed inset-0 z-10" onClick={() => setIsLessonMenuOpen(false)} />
                                              <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200 
                                                  ${dropUp.lesson 
                                                      ? "bottom-full mb-2 slide-in-from-bottom-2" // Đưa lên trên
                                                      : "top-full mt-2 slide-in-from-top-2"      // Đưa xuống dưới
                                                  }`}
                                              >
                                                  <div className="max-h-84 overflow-y-auto custom-scrollbar">
                                                      <button 
                                                          onClick={() => { setFormData({ ...formData, lessonID: '' }); setIsLessonMenuOpen(false); }}
                                                          className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                      >
                                                          Không chọn bài học
                                                      </button>
                                                      <div className="h-px bg-[#f4f0f2] my-1" />
                                                      {metadata.lessons.map(l => (
                                                          <button 
                                                              key={l.id} 
                                                              onClick={() => { setFormData({ ...formData, lessonID: l.id }); setIsLessonMenuOpen(false); }}
                                                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${formData.lessonID === l.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5 hover:text-primary'}`}
                                                          >
                                                              {l.name}
                                                              {formData.lessonID === l.id && <span className="material-symbols-outlined text-sm">check</span>}
                                                          </button>
                                                      ))}
                                                  </div>
                                              </div>
                                          </>
                                      )}
                                  </div>
                              </div>

                              {/* 3. SECTION VISIBILITY */}
                              <div className="pt-5 border-t border-[#f4f0f2]">
                                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Visibility</label>
                                  <div className="relative">
                                      <button 
                                          onClick={(e) => handleOpenDropdown('visibility', e)}
                                          className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                                      >
                                          <div className="flex items-center gap-2">
                                              <span className={`size-2 rounded-full ${visibility === 'Published' ? 'bg-green-500' : visibility === 'Draft' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                              <span className="font-bold">{visibility}</span>
                                          </div>
                                          <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isVisibilityMenuOpen ? 'rotate-180' : ''}`}>
                                              expand_more
                                          </span>
                                      </button>

                                      {isVisibilityMenuOpen && (
                                          <>
                                              <div className="fixed inset-0 z-10" onClick={() => setIsVisibilityMenuOpen(false)} />
                                              <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200
                                                  ${dropUp.visibility 
                                                      ? "bottom-full mb-2 slide-in-from-bottom-2" 
                                                      : "top-full mt-2 slide-in-from-top-2"
                                                  }`}
                                              >
                                            {['Published', 'Draft', 'Archived'].map((statusLabel) => (
                                            <button 
                                                key={statusLabel}
                                                type="button" // Thêm type để tránh submit form ngoài ý muốn
                                                onClick={() => { 
                                                // 1. Cập nhật state hiển thị chữ
                                                setVisibility(statusLabel); 
                                                const statusValue = statusLabel === 'Published' ? 1 : statusLabel === 'Draft' ? 0 : 2;
                                                
                                                // 3. Cập nhật vào FormData (trường 'status' là cái gửi lên API)
                                                setFormData(prev => ({ ...prev, status: statusValue }));
                                                
                                                // 4. Đóng menu
                                                setIsVisibilityMenuOpen(false); 
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
                                            >
                                                <span className={`size-2 rounded-full ${statusLabel === 'Published' ? 'bg-green-500' : statusLabel === 'Draft' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                                {statusLabel}
                                            </button>
                                            ))}
                                              </div>
                                          </>
                                      )}
                                  </div>
                            </div>

                          </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Sub-components (Giữ nguyên UI của bạn) ---
const VocabItem: React.FC<{ word: string; furigana: string; meaning: string }> = ({ word, furigana, meaning }) => (
    <div className="flex items-center gap-4 p-3 bg-background-light/50 rounded-xl border border-[#f4f0f2]">
        <div className="font-japanese text-lg font-bold text-[#181114] w-24">{word}</div>
        <div className="text-xs text-[#886373] w-32">{furigana}</div>
        <div className="flex-1 text-sm text-[#181114]">{meaning}</div>
        <button className="text-[#886373] hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
        </button>
    </div>
);

export default KanjiEditorPage;