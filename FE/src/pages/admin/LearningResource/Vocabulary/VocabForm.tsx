import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { vocabService } from '../../../../services/Admin/vocabService';
import { CreateUpdateVocabDTO } from '../../../../interfaces/Admin/Vocabulary';

const VocabularyEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Metadata (Chỉ fetch 1 lần khi load trang)
  const [metadata, setMetadata] = useState({
    levels: [] as any[],
    topics: [] as any[],
    lessons: [] as any[]
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
    wordType: 'Danh từ',
    levelID: '',
    topicID: '',
    lessonID: '',
    isCommon: false,
    mnemonics: '',
    priority: 0,
    status: 1, // 0: Draft, 1: Published, 2: Archived
    audioBase64: null as string | null,
    imageBase64: null as string | null,
    sentences: [{ japanese: '', vietnamese: '' }], 
    // relatedKanjiIDs: [] as string[]
  });

  const wordTypes = ['Danh từ', 'Động từ', 'Tính từ (I)', 'Tính từ (Na)', 'Trạng từ', 'Trợ từ'];

  // --- Fetch Metadata & Detail ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [lv, tp, ls] = await Promise.all([
          vocabService.getLevels(),
          vocabService.getTopics(),
          vocabService.getLessons()
        ]);
        setMetadata({ levels: lv, topics: tp, lessons: ls });

        if (id) {
          const data = await vocabService.getById(id);
          
          // Map label cho Visibility dựa trên status từ API
          const statusLabels: Record<number, string> = { 0: "Draft", 1: "Published", 2: "Archived" };
          setVisibility(statusLabels[data.status] || "Published");

          setFormData({
            word: data.word || '',
            reading: data.reading || '',
            meaning: data.meaning || '',
            wordType: data.wordType || 'Danh từ',
            levelID: data.levelID || '',
            topicID: data.topicID || '',
            lessonID: data.lessonID || '',
            isCommon: data.isCommon || false,
            mnemonics: data.mnemonics || '',
            priority: data.priority || 0,
            status: data.status ?? 1,
            audioBase64: data.audioURL || null,
            imageBase64: data.imageURL || null,
            sentences: data.examples?.length > 0 
              ? data.examples.map((ex: any) => ({ japanese: ex.content, vietnamese: ex.translation }))
              : [{ japanese: '', vietnamese: '' }],
            //relatedKanjiIDs: data.relatedKanjiIDs || []
          });
        }
      } catch (e) {
        console.error("Lỗi fetch dữ liệu:", e);
      }
    };
    loadInitialData();
  }, [id]);

  // --- Handlers ---
  const handleSave = async () => {
    // Validate cơ bản
    if (!formData.word || !formData.meaning || !formData.levelID) {
      alert("Vui lòng điền các trường bắt buộc (Word, Meaning, Level).");
      return;
    }

    const payload: CreateUpdateVocabDTO = {
      ...formData,
      priority: Number(formData.priority),
      status: formData.status,
      examples: formData.sentences
        .filter(s => s.japanese.trim() !== "")
        .map(s => ({
          content: s.japanese,
          translation: s.vietnamese
        })),
      // Đảm bảo gửi đúng field name backend cần
      audioURL: formData.audioBase64,
      imageURL: formData.imageBase64
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
      const msg = error.response?.data || "Có lỗi xảy ra khi lưu.";
      alert(msg);
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
                <h3 className="text-base font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">translate</span> Core Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Word (Kanji/Kana)</label>
                    <input name="word" value={formData.word} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-lg font-japanese focus:border-primary outline-none" placeholder="例：食べる" type="text"/>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Furigana</label>
                    <input name="reading" value={formData.reading} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm font-japanese focus:border-primary outline-none mt-1" placeholder="たべる" type="text"/>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Word Type</label>
                    <div className="relative">
                      <button onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm flex justify-between items-center">
                        {formData.wordType} <span className="material-symbols-outlined text-[#886373]">expand_more</span>
                      </button>
                      {isTypeMenuOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl overflow-hidden">
                          {wordTypes.map(t => (
                            <div key={t} onClick={() => { setFormData({...formData, wordType: t}); setIsTypeMenuOpen(false); }} className="px-4 py-2 hover:bg-primary/5 cursor-pointer text-sm">{t}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">
                      JLPT Level
                    </label>

                    <div className="flex gap-2 mt-4">
                      {metadata.levels.map((lv) => (
                        <button
                          key={lv.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, levelID: lv.id }))
                          }
                          className={`flex-1 py-2 text-[12px] font-bold rounded-xl transition-all border ${
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

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Meaning (Vietnamese)</label>
                    <textarea name="meaning" value={formData.meaning} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm min-h-25 resize-none outline-none focus:border-primary" placeholder="Enter meanings..."></textarea>
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
                    <span className="material-symbols-outlined text-sm pointer-events-none">add</span> <span className=" text-sm hover:underline">Add Sentence</span>
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
                        <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Japanese</label>
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
                        <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Vietnamese</label>
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
                    <p className="text-xs text-[#886373]">Chưa có câu ví dụ nào. Nhấn "Add Sentence" để thêm.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                <h3 className="text-base font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">graphic_eq</span> Pronunciation</h3>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="audio/*" />
                <div onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center border-2 border-dashed border-[#d1ced0] rounded-2xl p-6 hover:border-primary cursor-pointer bg-[#fbf9fa]">
                  <span className="material-symbols-outlined text-3xl text-[#886373] mb-2 group-hover:text-primary">cloud_upload</span>
                  <p className="text-[11px] font-bold text-[#886373] uppercase">{formData.audioBase64 ? 'Hệ thống đã nhận file âm thanh' : 'Upload MP3/WAV'}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6">
                {/* 1. SECTION TOPIC */}
                <div>
                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-3">
                    Topic Assignment
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm và chọn Topic..."
                        value={topicSearch}
                        onChange={(e) => {
                          setTopicSearch(e.target.value);
                          setIsTopicMenuOpen(true);
                        }}
                        onFocus={() => setIsTopicMenuOpen(true)}
                        className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      />
                    </div>

                    {isTopicMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsTopicMenuOpen(false)} />
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredTopics.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setFormData({ ...formData, topicID: t.id });
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
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tag Topic hiển thị bên dưới */}
                  <div className="mt-3 min-h-8">
                    {formData.topicID && (
                      <div className="inline-flex group relative">
                        <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[11px] font-bold rounded-full flex items-center">
                          <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">
                            label
                          </span>
                          {metadata.topics.find((t) => t.id === formData.topicID)?.name}
                        </div>
                        <button
                          onClick={() => setFormData({ ...formData, topicID: "" })}
                          className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SECTION LESSON */}
                <div className="pt-5 border-t border-[#f4f0f2]">
                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                    Lesson Assign
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
                    Visibility
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