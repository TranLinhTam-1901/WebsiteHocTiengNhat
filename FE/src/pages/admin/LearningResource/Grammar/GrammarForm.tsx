import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { grammarService } from '../../../../services/Admin/grammarService';
import { CreateUpdateGrammarDTO } from '../../../../interfaces/Admin/Grammar';

const GrammarEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // 1. Khởi tạo State khớp với giao diện của bạn
  const [formData, setFormData] = useState({
    title: '',
    structure: '',
    meaning: '',
    explanation: '',
    formality: '',
    similarGrammar: '',
    usageNote: '',
    status: 1,
    levelID: '',
    topicID: '',
    lessonID: '',
    // Đồng bộ tên field với Vocab để dùng chung logic UI
    sentences: [{ japanese: '', vietnamese: '', audioURL: '' }] 
  });

  console.log("Dữ liệu hiện tại trong Form:", formData.sentences);

  const [metadata, setMetadata] = useState({
    levels: [] as any[],
    topics: [] as any[],
    lessons: [] as any[]
  });

  const statusMap: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Archived' };
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  // Topic search
  const [topicSearch, setTopicSearch] = useState('');
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);

  // Lesson dropdown
  const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);

  // Visibility
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState('Published');

  // DropUp detect
  const [dropUp, setDropUp] = useState({ lesson: false, visibility: false });

  const handleOpenDropdown = (type: 'lesson' | 'visibility', e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const isCloseToBottom = windowHeight - rect.bottom < 500;

      setDropUp(prev => ({ ...prev, [type]: isCloseToBottom }));

      if (type === 'lesson') setIsLessonMenuOpen(!isLessonMenuOpen);
      if (type === 'visibility') setIsVisibilityMenuOpen(!isVisibilityMenuOpen);
  };

  const filteredTopics = metadata.topics.filter(t =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase())
  );

  // 2. Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
        try {
        setFetching(true);
        const [lvls, tops, less] = await Promise.all([
            grammarService.getLevels(),
            grammarService.getTopics(),
            grammarService.getLessons()
        ]);
        setMetadata({ levels: lvls || [], topics: tops || [], lessons: less || [] });

        if (isEditMode && id) {
            const data = await grammarService.getById(id);
            console.log("GRAMMAR DATA:", data);
            console.log("MAPPED SENTENCES:", formData.sentences);
            
            if (data.status !== undefined) {
            setVisibility(statusMap[data.status]);
            }

            setFormData({
            title: data.title || '',
            structure: data.structure || '',
            meaning: data.meaning || '',
            explanation: data.explanation || '',
            formality: data.formality || '',
            similarGrammar: data.similarGrammar || '',
            usageNote: data.usageNote || '',
            status: data.status ?? 1,
            levelID: data.levelID || '',
            topicID: data.topicID || '',
            lessonID: data.lessonID || '',
            sentences: data.examples?.length
                ? data.examples.map((ex: any) => ({
                    japanese: ex.japanese ?? "",
                    vietnamese: ex.vietnamese ?? "",
                    audioURL: ex.audioURL ?? ""
                    }))
                : [{ japanese: "", vietnamese: "", audioURL: "" }],
            });
        }
        } catch (error) {
        console.error("Lỗi fetch metadata:", error);
        } finally {
        setFetching(false);
        }
    };
    fetchData();
    }, [id, isEditMode]);

  // 3. Xử lý sự kiện
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Xử lý lưu dữ liệu
    const handleSave = async () => {
    setLoading(true);
    try {
        // Tạo payload đúng chuẩn Interface CreateUpdateGrammarDTO
        const payload: CreateUpdateGrammarDTO = { 
        ...formData,
        status: formData.status,
        examples: formData.sentences
            .filter((s) => s.japanese.trim() !== "") 
            .map((s) => ({
            content: s.japanese,
            translation: s.vietnamese,
            audioURL: s.audioURL
            }))
        };

        if (isEditMode && id) {
        await grammarService.update(id, payload);
        alert("Cập nhật thành công!");
        } else {
        await grammarService.create(payload);
        alert("Thêm mới thành công!");
        }
        navigate('/admin/resource/grammar');
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
    } finally {
        setLoading(false);
    }
    };

  if (fetching) return <div className="flex h-screen items-center justify-center font-bold text-primary italic">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* --- Header Section (GIỮ NGUYÊN 100%) --- */}
        <AdminHeader>
          <div className={isEditMode ? 'flex items-center w-full gap-240' : 'flex items-center w-full gap-255'}>
              <div className="flex items-center gap-4 flex-1">
                <button 
                    onClick={() => navigate(-1)}
                    className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-[#181114] uppercase">
                        {isEditMode ? 'Chỉnh sửa ngữ pháp' : 'Thêm ngữ pháp'}
                    </h2>
                    <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                    <span>Quản lý</span>
                    <span>/</span>
                    <span className="text-primary font-bold">{isEditMode ? 'Chỉnh sửa' : 'thêm mới'}</span>
                    </nav>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'save'}</span>
                  {loading ? 'Đang lưu...' : 'Lưu Ngữ pháp'}
                </button>
              </div>
          </div>
        </AdminHeader>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-2 space-y-8">
                {/* Basic Info */}
                <div className="bg-white rounded-2xl p-8 border border-[#f4f0f2] shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Title</label>
                    <input 
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-lg focus:border-primary outline-none transition-all" 
                        placeholder="例：Khẳng định" 
                        type="text" 
                    />
                    </div>

                    {/* Structure */}
                    <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Structure</label>
                    <input 
                        name="structure"
                        value={formData.structure}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm mt-1 font-japanese focus:border-primary outline-none transition-all" 
                        placeholder="例：N1 は N2 です" 
                        type="text" 
                    />
                    </div>

                    {/* JLPT Level */}
                    <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">JLPT Level</label>
                    <div className="flex gap-2 mt-3">
                        {metadata.levels.map((lvl) => (
                        <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, levelID: lvl.id }))}
                            className={`flex-1 py-2 text-[12px] font-bold rounded-xl transition-all border ${
                            formData.levelID === lvl.id
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                : "border-[#f4f0f2] text-[#886373]"
                            }`}
                        >
                            {lvl.name}
                        </button>
                        ))}
                    </div>
                    </div>

                    {/* Meaning */}
                    <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Meaning</label>
                    <input 
                        name="meaning"
                        value={formData.meaning}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm focus:border-primary outline-none transition-all" 
                        placeholder="Enter meaning..." 
                        type="text" 
                    />
                    </div>

                    {/* Explanation */}
                    <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-[#886373] uppercase mb-2">Explanation</label>
                    <textarea 
                        name="explanation"
                        value={formData.explanation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm min-h-25 resize-none outline-none focus:border-primary transition-all" 
                        placeholder="Explain the meaning clearly..." 
                        rows={3}
                    ></textarea>
                    </div>
                </div>
                </div>

                {/* Example Sentences */}
                <div className="bg-white rounded-2xl p-8 border border-[#f4f0f2] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">translate</span>
                            Example Sentences
                        </h3>
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, sentences: [...formData.sentences, {japanese: '', vietnamese: '', audioURL: ''}]})} 
                            className="text-xs font-bold text-primary flex items-center gap-1 group"
                        >
                            <span className="material-symbols-outlined text-sm">add</span> 
                            <span className="text-sm group-hover:underline">Add Sentence</span>
                        </button>
                    </div>

                    {/* Section Render - Sử dụng Optional Chaining ?. để tránh crash */}
                    <div className="space-y-6">
                        {formData.sentences?.map((ex, i) => (
                            <div key={i} className="p-6 bg-[#fbf9fa] rounded-2xl border border-[#f4f0f2] relative group transition-all focus-within:border-primary/30">
                                
                                {/* Nút xóa */}
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const news = formData.sentences.filter((_, index) => index !== i);
                                        setFormData({...formData, sentences: news});
                                    }}
                                    className="absolute -top-2 -right-2 size-8 bg-white text-red-400 rounded-full shadow-sm border border-[#f4f0f2] flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>

                                <div className="space-y-4">
                                    {/* Japanese Content */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider mb-1">Japanese</label>
                                        <input 
                                            value={ex.japanese} 
                                            onChange={(e) => {
                                                const news = [...formData.sentences]; 
                                                news[i].japanese = e.target.value; 
                                                setFormData({...formData, sentences: news});
                                            }} 
                                            className="w-full bg-white rounded-lg p-3 text-sm font-japanese border border-[#f4f0f2] outline-none focus:border-primary" 
                                            placeholder="例：新しい料理を食べてみました。" 
                                        />
                                    </div>

                                    {/* Translation */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider mb-1">Vietnamese</label>
                                        <input 
                                            value={ex.vietnamese} 
                                            onChange={(e) => {
                                                const news = [...formData.sentences]; 
                                                news[i].vietnamese = e.target.value; 
                                                setFormData({...formData, sentences: news});
                                            }} 
                                            className="w-full bg-white rounded-lg p-3 text-sm border border-[#f4f0f2] outline-none focus:border-primary" 
                                            placeholder="Tôi đã thử ăn món ăn mới." 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Thông báo nếu mảng rỗng */}
                        {(!formData.sentences || formData.sentences.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed border-[#f4f0f2] rounded-xl">
                                <p className="text-xs text-[#886373]">Chưa có câu ví dụ nào. Nhấn "Add Sentence" để thêm.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: AI & Settings */}
            <div className="lg:col-span-1 space-y-8">
            {/* AI Helper */}
            <div className="bg-linear-to-br from-primary/5 to-white rounded-2xl p-8 border border-primary/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl">smart_toy</span>
                </div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                AI Helper
                </h3>
                <p className="text-[11px] text-[#886373] mb-4 leading-relaxed">
                Hệ thống sẽ dựa trên giải thích của bạn để tối ưu nội dung cho học sinh.
                </p>
                <button className="mt-4 w-full py-3 bg-white border border-primary/20 rounded-xl text-primary text-xs font-bold hover:bg-primary/5 transition-colors">
                Generate AI Suggestion
                </button>
            </div>

            {/* Publication Settings */}
            <div className="bg-white rounded-2xl p-8 border border-[#f4f0f2] shadow-sm">

                <div className="space-y-6">
                    {/* 1. SECTION TOPIC */}
                    <div>
                    <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
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

                    <div className="mt-3 min-h-8">
                        {formData.topicID && (
                        <div className="inline-flex group relative">
                            <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[11px] font-bold rounded-full flex items-center">
                            <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">label</span>
                            {/* Lấy tên từ danh sách gốc trong metadata hoặc filteredTopics */}
                            {metadata.topics?.find((t) => t.id === formData.topicID)?.name || "Selected Topic"}
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
                        type="button"
                        onClick={(e) => handleOpenDropdown("lesson", e)}
                        className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                        >
                        <span className={formData.lessonID ? "text-[#181114]" : "text-[#886373]/60"}>
                            {metadata.lessons?.find((l) => l.id === formData.lessonID)?.name || "-- Chọn bài học --"}
                        </span>
                        <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isLessonMenuOpen ? "rotate-180" : ""}`}>
                            expand_more
                        </span>
                        </button>

                        {isLessonMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsLessonMenuOpen(false)} />
                            <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200 
                            ${dropUp.lesson ? "bottom-full mb-2 slide-in-from-bottom-2" : "top-full mt-2 slide-in-from-top-2"}`}>
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
                                {metadata.lessons?.map((l) => (
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
                        type="button"
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
                            <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-xl p-1 animate-in fade-in duration-200
                            ${dropUp.visibility ? "bottom-full mb-2 slide-in-from-bottom-2" : "top-full mt-2 slide-in-from-top-2"}`}>
                            {["Published", "Draft", "Archived"].map((statusName) => (
                                <button
                                key={statusName}
                                onClick={() => {
                                    const statusValue = Object.keys(statusMap).find(key => statusMap[Number(key)] === statusName);
                                    setVisibility(statusName);
                                    setFormData({ ...formData, status: Number(statusValue) });
                                    setIsVisibilityMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
                                >
                                <span className={`size-1.5 rounded-full ${statusName === "Published" ? "bg-green-500" : statusName === "Draft" ? "bg-yellow-500" : "bg-red-500"}`} />
                                {statusName}
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
        </div>
      </main>
    </div>
  );
};

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-2 py-1 bg-[#f4f0f2] text-[#886373] text-[10px] rounded-md flex items-center gap-1">
    {label} <span className="material-symbols-outlined text-[12px] cursor-pointer">close</span>
  </span>
);

export default GrammarEditorPage;