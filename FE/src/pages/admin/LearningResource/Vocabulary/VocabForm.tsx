import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { vocabService } from '../../../../services/Admin/vocabService';
import { VocabularyItem, CreateUpdateVocabDTO, RelatedKanjiItem } from '../../../../interfaces/Admin/Vocabulary';

const VocabularyEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Metadata (Chỉ fetch 1 lần khi load trang)
  const [metadata, setMetadata] = useState({
    levels: [] as any[],
    topics: [] as any[],
    lessons: [] as any[],
    wordTypes: [] as any[]
  });

  // UI States
  const [topicSearch, setTopicSearch] = useState('');
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState('Published');
  const [dropUp, setDropUp] = useState({ lesson: false, visibility: false });
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    word: '',
    reading: '',
    meaning: '',
    wordTypeIDs: [] as string[], // Chuyển thành mảng ID
    levelID: '',
    topicIDs: [] as string[],    // Chuyển thành mảng ID
    lessonID: '',
    isCommon: false,
    mnemonics: '',
    priority: 0,
    status: 1, 
    audioBase64: null as string | null,
    imageBase64: null as string | null,
    sentences: [{ japanese: '', vietnamese: '' }], 
    relatedKanjis: [] as RelatedKanjiItem[]
  });

  // --- Fetch Metadata & Detail ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 1. Fetch metadata trước
        const [lv, tp, ls, wt] = await Promise.all([
          vocabService.getLevels(),
          vocabService.getTopics(),
          vocabService.getLessons(),
          vocabService.getWordTypes()
        ]);
        setMetadata({ levels: lv, topics: tp, lessons: ls, wordTypes: wt });

        // 2. Nếu có ID thì fetch chi tiết
        if (id) {
          const data: VocabularyItem = await vocabService.getById(id);
          console.log("Dữ liệu Vocabulary nhận về:", data); // Để kiểm tra tên field

          const statusLabels: Record<number, string> = { 0: "Draft", 1: "Published", 2: "Archived" };
          setVisibility(statusLabels[data.status] || "Published");

          setFormData(prev => ({
            ...prev,
            word: data.word || '',
            reading: data.reading || '',
            meaning: data.meaning || '',

            topicIDs: Array.isArray((data as any).topicIDs) 
              ? (data as any).topicIDs.map(String) 
              : [],

            // SỬA: Tương tự cho WordType
            wordTypeIDs: Array.isArray((data as any).wordTypeIDs) 
              ? (data as any).wordTypeIDs.map(String) 
              : [],

            levelID: data.levelID || '',
            lessonID: data.lessonID || '',
            isCommon: data.isCommon || false,
            mnemonics: data.mnemonics || '',
            priority: data.priority || 0,
            status: data.status ?? 1,
            audioBase64: data.audioURL || null,
            imageBase64: data.imageURL || null,
            
            sentences: data.examples && data.examples.length > 0 
              ? data.examples.map((ex: any) => ({ 
                  japanese: ex.content || '', 
                  vietnamese: ex.translation || '' 
                }))
              : [{ japanese: '', vietnamese: '' }],
              
            relatedKanjis: data.relatedKanjis || []
          }));
        }
      } catch (e) {
        console.error("Lỗi fetch dữ liệu:", e);
      }
    };
    loadInitialData();
  }, [id]);

  // --- Handlers ---
  const handleSave = async () => {
    if (!formData.word || !formData.meaning || !formData.levelID) {
      alert("Vui lòng điền các trường bắt buộc.");
      return;
    }

    const payload: CreateUpdateVocabDTO = {
      word: formData.word,
      reading: formData.reading,
      meaning: formData.meaning,
      wordTypeIDs: formData.wordTypeIDs, // Gửi mảng ID
      isCommon: formData.isCommon,
      mnemonics: formData.mnemonics || null,
      imageURL: formData.imageBase64,
      audioURL: formData.audioBase64,
      priority: Number(formData.priority),
      status: formData.status,
      levelID: formData.levelID,
      topicIDs: formData.topicIDs, // Gửi mảng ID
      lessonID: formData.lessonID,
      examples: formData.sentences
        .filter(s => s.japanese.trim() !== "")
        .map(s => ({
          content: s.japanese,
          translation: s.vietnamese
        })),
      relatedKanjis: formData.relatedKanjis
    };

    try {
      if (id) {
        await vocabService.update(id, payload);
        alert("Cập nhật thành công!");
      } else {
        await vocabService.create(payload);
        alert("Thêm mới thành công!");
      }
      navigate('/admin/resource/vocabulary');
    } catch (error: any) {
      alert(error.response?.data || "Có lỗi xảy ra.");
    }
  };

  const filteredTopics = metadata.topics.filter(t =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase())
  );
  
  // --- 4. Handlers (Giữ nguyên logic của bạn) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, audioBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDropdown = (type: 'lesson' | 'visibility', e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const isCloseToBottom = windowHeight - rect.bottom < 500;

    setDropUp(prev => ({ ...prev, [type]: isCloseToBottom }));

    if (type === 'lesson') setIsLessonMenuOpen(!isLessonMenuOpen);
    if (type === 'visibility') setIsVisibilityMenuOpen(!isVisibilityMenuOpen);
  };
  console.log("DEBUG - IDs in Form:", formData.topicIDs);
  console.log("DEBUG - Topics Metadata:", metadata.topics);
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* --- Header --- */}
        <AdminHeader>
          <div className={id ? 'flex items-center w-full gap-247' : 'flex items-center w-full gap-262'}>
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => navigate(-1)} className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-[#181114] uppercase">{id ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng'}</h2>
                <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                  <span>Quản lý</span> / <span className="text-primary font-bold">{id ? 'Chỉnh sửa' : 'Thêm mới'}</span>
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
                <span className="material-symbols-outlined text-sm">save</span> Lưu Từ vựng
              </button>
            </div>
          </div>
        </AdminHeader>

        {/* --- Form Body (Giữ nguyên UI của bạn) --- */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">translate</span> Core Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* HÀNG 1: Word & Furigana */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Word (Kanji/Kana)</label>
                    <input name="word" value={formData.word} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-lg font-japanese focus:border-primary outline-none" placeholder="例：食べる" type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Phiên âm (furigana)</label>
                    <input name="reading" value={formData.reading} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm font-japanese focus:border-primary outline-none" placeholder="たべる" type="text" />
                  </div>

                  {/* HÀNG 2: Cột JLPT Level & Cột (Thông dụng + Ưu tiên) */}
                  <div className="space-y-2 ">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">JLPT Level</label>
                    <div className="flex gap-2 mt-3">
                      {metadata.levels.map((lv) => (
                        <button
                          key={lv.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, levelID: lv.id }))}
                          className={`flex-1 py-3 text-[12px] font-bold rounded-xl transition-all border ${
                            formData.levelID === lv.id
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                              : "border-[#f4f0f2] text-[#886373]"
                          }`}
                        >
                          {lv.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ô chứa Thông dụng + Ưu tiên (Thế chỗ Word Type cũ) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Cấu hình hiển thị</label>
                    <div className="flex items-center h-13.5 px-4 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl">
                      
                      {/* Phần Độ thông dụng - Dùng flex-1 và cố định vị trí nút gạt */}
                      <div className="flex items-center border-r border-[#f4f0f2] h-1/2 flex-1 pr-4">
                        <div className="w-full flex items-center justify-between">
                          {/* Bọc text vào một div có chiều rộng cố định hoặc để nó tự do nhưng nút gạt luôn ở cuối */}
                          <span className="text-sm font-medium text-black min-w-25">
                            {formData.isCommon ? "Từ thông dụng" : "Từ hiếm gặp"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isCommon: !formData.isCommon })}
                            className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              formData.isCommon ? "bg-primary" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                formData.isCommon ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Phần Thứ tự ưu tiên - Chỉ focus vào ô input */}
                      <div className="flex items-center gap-3 pl-6 flex-1">
                        <span className="text-[10px] font-bold text-[#886373]/60 uppercase whitespace-nowrap">Mức ưu tiên</span>
                        <input
                          name="priority"
                          type="number"
                          value={formData.priority}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="0"
                          className="w-full max-w-30 px-4 py-1.5 bg-white border border-[#f4f0f2] rounded-lg text-sm font-bold text-black outline-none shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-primary/30"
                        />
                      </div>

                    </div>
                  </div>

                  {/* HÀNG 3: Word Type (Dùng giao diện y chang Topic, chiếm 2 cột) */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-3">
                      Word Type Assignment
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Tìm và thêm loại từ (Danh từ, Động từ...)"
                          onFocus={() => setIsTypeMenuOpen(true)}
                          className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        />
                      </div>

                      {isTypeMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsTypeMenuOpen(false)} />
                          <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                            {metadata.wordTypes
                              .filter(t => !formData.wordTypeIDs.includes(t.id))
                              .map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, wordTypeIDs: [...formData.wordTypeIDs, t.id] });
                                    setIsTypeMenuOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between group"
                                >
                                  {t.name}
                                  <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100">add</span>
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Pills hiển thị Word Type */}
                    <div className="mt-3 flex flex-wrap gap-2 min-h-8">
                      {formData.wordTypeIDs.map((id) => {
                        const type = metadata.wordTypes.find(t => t.id === id);
                        if (!type) return null;
                        return (
                          <div key={id} className="inline-flex group relative animate-in zoom-in duration-200">
                            <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[11px] font-bold rounded-full flex items-center">
                              <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">bookmarks</span>
                              {type.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, wordTypeIDs: formData.wordTypeIDs.filter(tid => tid !== id) })}
                              className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HÀNG 4: Meaning */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Nghĩa (tiếng Việt)</label>
                    <textarea name="meaning" value={formData.meaning} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm min-h-20 resize-none outline-none focus:border-primary" placeholder="Enter meanings..."></textarea>
                  </div>
                </div>
              </div>

              {/* Example Sentences */}
              <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">translate</span> 
                    Example Sentences
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, sentences: [...formData.sentences, {japanese: '', vietnamese: ''}]})} 
                    className="text-xs font-bold text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm pointer-events-none">add</span> <span className=" text-sm hover:underline">Thêm câu ví dụ</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.sentences.map((s, i) => (
                    <div key={i} className="relative group grid gap-3 p-5 bg-[#fbf9fa] rounded-xl border border-[#f4f0f2] transition-all focus-within:border-primary/30">
                      
                      {/* Nút xóa câu ví dụ */}
                      <button 
                        type="button"
                        onClick={() => {
                          const news = formData.sentences.filter((_, index) => index !== i);
                          setFormData({...formData, sentences: news});
                        }}
                        className="absolute -top-2 -right-2 size-7 bg-white text-red-400 rounded-full shadow-sm border border-[#f4f0f2] flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>

                      {/* Input Tiếng Nhật */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Tiếng Nhật</label>
                        <input 
                          value={s.japanese} 
                          onChange={(e) => {
                            const news = [...formData.sentences]; 
                            news[i].japanese = e.target.value; 
                            setFormData({...formData, sentences: news});
                          }} 
                          className="w-full px-4 py-2 bg-white border border-[#f4f0f2] rounded-lg text-sm font-japanese outline-none focus:border-primary transition-all" 
                          placeholder="例：新しい料理を食べてみました。" 
                        />
                      </div>

                      {/* Input Tiếng Việt */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Tiếng Việt</label>
                        <input 
                          value={s.vietnamese} 
                          onChange={(e) => {
                            const news = [...formData.sentences]; 
                            news[i].vietnamese = e.target.value; 
                            setFormData({...formData, sentences: news});
                          }} 
                          className="w-full px-4 py-2 bg-white border border-[#f4f0f2] rounded-lg text-sm outline-none focus:border-primary transition-all" 
                          placeholder="Tôi đã thử ăn món ăn mới." 
                        />
                      </div>

                    </div>
                  ))}
                </div>

                {formData.sentences.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-[#f4f0f2] rounded-xl">
                    <p className="text-xs text-[#886373]">Chưa có câu ví dụ nào. Nhấn &quot;Thêm câu ví dụ&quot; để thêm.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">

            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#f287b6]/5">
              <p className="text-[15px] font-bold text-slate-700 mb-3">Hình ảnh minh họa</p>
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-[#f287b6] text-3xl transition-all">add_photo_alternate</span>
                  <span className="text-[15px] font-bold text-slate-400 group-hover:text-[#f287b6] mt-1">Tải file ảnh</span>
                </div>
              </div>
            </div>
              
            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
              <h3 className="text-base font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">graphic_eq</span> Pronunciation</h3>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="audio/*" />
              <div onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center border-2 border-dashed border-[#d1ced0] rounded-2xl p-6 hover:border-primary cursor-pointer bg-[#fbf9fa]">
                <span className="material-symbols-outlined text-3xl text-[#886373] mb-2 group-hover:text-primary">cloud_upload</span>
                <p className="text-[11px] font-bold text-[#886373] uppercase">{formData.audioBase64 ? 'Hệ thống đã nhận file âm thanh' : 'Tải lên MP3/WAV'}</p>
              </div>

              <div className="grid grid-cols-1 gap-8 mt-4">
                <div className="space-y-6">
                  <div className="p-4 bg-background-light rounded-xl border border-[#f287b6]/10">
                    <div className="flex items-center gap-3">
                      <button className="size-8 rounded-full bg-[#f287b6] text-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      </button>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-[#f287b6]"></div>
                      </div>
                      <span className="text-xs font-mono text-slate-500">0:45 / 2:30</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6">
              {/* 1. SECTION TOPIC */}
              <div>
                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-3">
                      Gán chủ đề
                  </label>
                  <div className="relative">
                      {/* Search Input */}
                      <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                              search
                          </span>
                          <input
                              type="text"
                              placeholder="Tìm và thêm nhiều chủ đề..."
                              value={topicSearch}
                              onChange={(e) => {
                                  setTopicSearch(e.target.value);
                                  setIsTopicMenuOpen(true);
                              }}
                              onFocus={() => setIsTopicMenuOpen(true)}
                              className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                          />
                      </div>

                      {/* Dropdown Menu */}
                      {isTopicMenuOpen && (
                          <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsTopicMenuOpen(false)} />
                              <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                  {metadata.topics
                                      .filter(t => 
                                          t.name.toLowerCase().includes(topicSearch.toLowerCase()) && 
                                          !formData.topicIDs.includes(t.id) // Chỉ hiện những topic chưa chọn
                                      )
                                      .map((t) => (
                                          <button
                                              key={t.id}
                                              type="button"
                                              onClick={() => {
                                                  setFormData({ 
                                                      ...formData, 
                                                      topicIDs: [...formData.topicIDs, t.id] // Thêm id mới vào mảng
                                                  });
                                                  setTopicSearch("");
                                                  setIsTopicMenuOpen(false);
                                              }}
                                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between group"
                                          >
                                              {t.name}
                                              <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                  add
                                              </span>
                                          </button>
                                      ))}
                                  {/* Hiển thị khi không tìm thấy kết quả */}
                                  {metadata.topics.filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()) && !formData.topicIDs.includes(t.id)).length === 0 && (
                                      <div className="p-3 text-center text-xs text-gray-400">Không còn topic nào để thêm</div>
                                  )}
                              </div>
                          </>
                      )}
                  </div>

                  {/* Pills hiển thị Danh sách Tag đã chọn */}
                  <div className="mt-3 flex flex-wrap gap-2 min-h-8">
                      {formData.topicIDs.map((id) => {
                          const topic = metadata.topics.find(t => String(t.id).toLowerCase() === String(id).toLowerCase());
                          if (!topic) return null;
                          
                          return (
                              <div key={id} className="inline-flex group relative animate-in zoom-in duration-200">
                                  <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[11px] font-bold rounded-full flex items-center">
                                      <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">
                                          label
                                      </span>
                                      {topic.name}
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => setFormData({ 
                                          ...formData, 
                                          topicIDs: formData.topicIDs.filter(tid => tid !== id) // Xóa tag khỏi mảng
                                      })}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100"
                                  >
                                      <span className="material-symbols-outlined text-[14px]">close</span>
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* 2. SECTION LESSON */}
              <div className="pt-5 border-t border-[#f4f0f2]">
                <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                  Gán bài học
                </label>
                <div className="relative">
                  <button
                    onClick={(e) => handleOpenDropdown("lesson", e)}
                    className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                  >
                    <span className={formData.lessonID ? "text-[#181114]" : "text-[#886373]/60"}>
                      {metadata.lessons.find((l) => l.id === formData.lessonID)?.name || "-- Chọn bài học --"}
                    </span>
                    <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isLessonMenuOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>

                  {isLessonMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsLessonMenuOpen(false)} />
                      <div
                        className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200 
                        ${dropUp.lesson ? "bottom-full mb-2 slide-in-from-bottom-2" : "top-full mt-2 slide-in-from-top-2"}`}
                      >
                        <div className="max-h-84 overflow-y-auto custom-scrollbar">
                          <button
                            onClick={() => {
                              setFormData({ ...formData, lessonID: "" });
                              setIsLessonMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Không chọn bài học
                          </button>
                          <div className="h-px bg-[#f4f0f2] my-1" />
                          {metadata.lessons.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => {
                                setFormData({ ...formData, lessonID: l.id });
                                setIsLessonMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${formData.lessonID === l.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-primary/5 hover:text-primary"}`}
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
                <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                  Hiển thị
                </label>
                <div className="relative">
                  <button
                    onClick={(e) => handleOpenDropdown("visibility", e)}
                    className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${visibility === "Published" ? "bg-green-500" : visibility === "Draft" ? "bg-yellow-500" : "bg-red-500"}`} />
                      <span className="font-bold text-[#181114]">{visibility}</span>
                    </div>
                    <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isVisibilityMenuOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>

                  {isVisibilityMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsVisibilityMenuOpen(false)} />
                      <div
                        className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-xl p-1 animate-in fade-in duration-200
                        ${dropUp.visibility ? "bottom-full mb-2 slide-in-from-bottom-2" : "top-full mt-2 slide-in-from-top-2"}`}
                      >
                        {["Published", "Draft", "Archived"].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setVisibility(status);
                              // Ánh xạ chữ sang số để lưu vào database
                              const statusValue = status === "Published" ? 1 : status === "Draft" ? 0 : 2;
                              setFormData({ ...formData, status: statusValue });
                              setIsVisibilityMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <span className={`size-2 rounded-full ${status === "Published" ? "bg-green-500" : status === "Draft" ? "bg-yellow-500" : "bg-red-500"}`} />
                            {status}
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

export default VocabularyEditorPage;