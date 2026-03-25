import React, { useState, useEffect } from 'react'; // Đảm bảo có useEffect ở đây
import { useParams, useNavigate } from 'react-router-dom';
import SourcePanel from '../../../components/Admin/QuestionEditor/SourcePanel';
import AnswerEditor from '../../../components/Admin/QuestionEditor/AnswerEditor';
import QuestionService from '../../../services/Admin/questionService';
import { CreateQuestionDTO, QuestionType, SourceMaterial, AnswerDTO, Topics, QuestionStatus, SkillType } from '../../../interfaces/Admin/QuestionBank';
import { QUESTION_TYPE_OPTIONS, DIFFICULTY_OPTIONS, QUESTION_TYPE_LABELS, SKILL_TYPE_OPTIONS } from '../../../constants/admin/questionOptions';
import { toast } from 'react-hot-toast';

const QuestionCreatePage: React.FC = () => {
    // --- 1. HOOKS (Luôn để trên cùng) ---
    const { id, lessonId } = useParams<{ id?: string; lessonId: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // --- 2. STATE ---
    const [formData, setFormData] = useState<CreateQuestionDTO>({
        lessonID: lessonId || '', 
        content: '',
        questionType: QuestionType.MultipleChoice,
        difficulty: 1,
        explanation: '',
        status: QuestionStatus.Active,
        topicIds: [],
        answers: [
            { answerText: '', isCorrect: true },
            { answerText: '', isCorrect: false }
        ],
        sourceID: null,
        skillType: SkillType.Vocabulary,
        // audioURL: '',
        // mediaTimestamp: 0
    });

    useEffect(() => {
    const loadQuestionData = async () => {
        if (isEditMode && id) {
            try {
                const data = await QuestionService.getQuestionDetail(id);
                
                // Đổ dữ liệu vào form, chỉ giữ lại các trường bạn liệt kê
                setFormData({
                    lessonID: data.lessonID || '',
                    content: data.content || '',
                    questionType: data.questionType,
                    difficulty: data.difficulty,
                    explanation: data.explanation || '',
                    equivalentID: data.equivalentID || null,
                    sourceID: data.sourceID || null,
                    status: data.status,
                    // mediaTimestamp: data.mediaTimestamp || 0,
                    // Map lại từ bảng trung gian QuestionTopics của Backend
                    topicIds: (data as any).questionTopics 
                        ? (data as any).questionTopics.map((qt: any) => qt.topicID) 
                        : (data.topicIds || []),                   // Giữ nguyên mảng answers (bao gồm cả AnswerID để Backend biết là update)
                    answers: data.answers || []
                });

                if (data.equivalentID) {
                    setSelectedEquivalentContent(data.equivalentID);
                }
            } catch (error) {
                console.error("Lỗi khi tải chi tiết câu hỏi:", error);
            }
        }
    };
    loadQuestionData();
}, [id, isEditMode]);

    const [topics, setTopicsLookup] = useState<Topics[]>([]);
    const handleAddTag = (id: string) => { if(!formData.topicIds.includes(id)) setFormData({...formData, topicIds: [...formData.topicIds, id]}) };
    const handleRemoveTag = (id: string) => { setFormData({...formData, topicIds: formData.topicIds.filter(x => x !== id)}) };
   
    
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data = await QuestionService.getTopicsLookup();
                setTopicsLookup(data); // Đổ dữ liệu vào state 'topics'
            } catch (error) {
                console.error("Không thể load danh sách Topic", error);
            }
        };
        fetchTopics();
    }, []);
    // --- 4. HANDLERS (Logic xử lý) ---
    const handlePickSource = (item: SourceMaterial, type: string) => {
        let autoContent = '';
        let autoExplanation = item.meaning || '';
        let autoAnswers: AnswerDTO[] = [];
        let autoSkillType = SkillType.Vocabulary;

        switch (type) {

            case 'Vocabulary':
                autoSkillType = SkillType.Vocabulary;
                autoContent = `Chọn nghĩa đúng của từ: ${item.word}`;
                autoAnswers = [
                    { answerText: item.meaning || '', isCorrect: true },
                    { answerText: 'Nghĩa giả 1', isCorrect: false },
                    { answerText: 'Nghĩa giả 2', isCorrect: false },
                ];
                break;
            case 'Kanji':
                autoSkillType = SkillType.Kanji;
                autoContent = `Cách đọc Onyomi của chữ Hán "${item.character}" là gì?`;
                 autoAnswers = [
                { answerText: item.onyomi || '', isCorrect: true },
                { answerText: 'Đáp án sai 1', isCorrect: false },
                { answerText: 'Đáp án sai 2', isCorrect: false },
            ];
                break;

            case 'Grammar': 
            autoSkillType = SkillType.Grammar;
            autoContent = `Hoàn thành cấu trúc ngữ pháp: ${item.structure || 'N/A'}`;
            autoAnswers = [
                { answerText: item.meaning || '', isCorrect: true },
                { answerText: 'Đáp án sai 1', isCorrect: false },
                { answerText: 'Đáp án sai 2', isCorrect: false },
            ];
            break;
        }

        setFormData(prev => ({
            ...prev,
            content: autoContent,
            explanation: autoExplanation,
            sourceID: item.id,
            skillType: autoSkillType,
            // audioURL: item.audioURL || '',
            // mediaTimestamp: (item as any).mediaTimestamp || 0,
            answers: autoAnswers.length > 0 ? autoAnswers : prev.answers,
            topicIds: item.topicID ? [item.topicID] : prev.topicIds
        }));
    };

    const processSubmit = async (status: QuestionStatus) => {
    // Validate cơ bản cho cả 2 trường hợp
    if (!formData.lessonID) {
        toast.error("Vui lòng chọn bài học trước khi lưu!");
        return;
    }

    // Validate nâng cao khi chọn "Tạo chính thức" (Active)
    if (status === QuestionStatus.Active) {
        const hasCorrect = formData.answers.some(a => a.isCorrect);
        if (!hasCorrect) {
            toast.error("Câu hỏi chính thức phải có ít nhất một đáp án đúng!");
            return;
        }
        if (!formData.content.trim()) {
            toast.error("Nội dung câu hỏi không được để trống!");
            return;
        }
    }

    try {
        // Gộp status trực tiếp vào payload để gửi đi
        const payload = { ...formData, status } as any;;
        
       
        let message = "";
      // 4. KIỂM TRA ĐIỀU KIỆN EDIT HAY CREATE
        if (isEditMode && id) {
            await QuestionService.updateQuestion(id, payload);
            message = status === QuestionStatus.Draft 
                ? "✨ Đã cập nhật bản nháp thành công!" 
                : "🚀 Đã cập nhật câu hỏi thành công!";
        } else {
            await QuestionService.createQuestion(payload);
            message = status === QuestionStatus.Draft 
                ? "✨ Đã lưu bản nháp thành công!" 
                : "🚀 Đã tạo câu hỏi chính thức thành công!";
        }

        toast.success(message);
        setTimeout(() => {
        navigate(-1);
    }, 1500);
        
    } catch (error: any) {
        const errorMsg = error.response?.data?.detail || "Không thể lưu câu hỏi";
        toast.error("Lỗi: " + errorMsg);
    }
    };


    // Câu hỏi tương đương
        // --- STATE CHO CÂU HỎI TƯƠNG ĐƯƠNG ---
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]); // Khởi tạo là mảng rỗng
    const [isSearching, setIsSearching] = useState(false);
    const [selectedEquivalentContent, setSelectedEquivalentContent] = useState<string | null>(null);

    // --- LOGIC SEARCH VỚI DEBOUNCE ---
    useEffect(() => {
        // Nếu ô nhập trống thì xóa gợi ý ngay
        if (!searchTerm.trim()) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await QuestionService.searchEquivalent(searchTerm);
                // Đảm bảo data luôn là mảng để không bị lỗi .map()
                setSuggestions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Lỗi API Search:", error);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 600); // Đợi người dùng ngừng gõ 0.6s

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectEquivalent = (q: any) => {
        setFormData({ ...formData, equivalentID: q.questionID});
        setSelectedEquivalentContent(q.content); // Lưu lại nội dung để hiển thị cho Admin xem
        setSuggestions([]);
        setSearchTerm('');
    };


    return (
    <div className="flex h-full min-w-[380px] overflow-hidden bg-[#F4F7FE]">
        
        {/* CỘT 1: MATERIAL LIBRARY - Tăng nhẹ width để thoải mái hơn */}
        <div className="flex h-full w-[380px] min-w-[380px] flex-col overflow-hidden border-r border-[#E8E8E8] bg-white shadow-[4px_0_10px_rgba(0,0,0,0.03)]">
            <div className="flex flex-1 flex-col min-h-0 px-[15px] pb-[10px] pt-[24px]">
                <h3 className="mb-[15px] shrink-0 text-lg font-bold text-[#2D3748]">
                    <span className="mr-2">📕</span> Thư viện tài liệu
                </h3>
                
                <div className="flex flex-1 flex-col min-h-0 w-full">
                    <SourcePanel 
                        currentLessonId={formData.lessonID}
                        onPick={handlePickSource} 
                        onLessonChange={(id, levelName) => {
                            const matched = DIFFICULTY_OPTIONS.find(opt => opt.label === levelName);
                            setFormData(prev => ({
                                ...prev,
                                lessonID: id,
                                difficulty: matched ? matched.value : 1
                            }));
                        }}
                    />
                </div>
            </div>
        </div>

        {/* CỘT 2: QUESTION EDITOR */}
        <div className="flex-1 overflow-y-auto bg-[#FFF8F9] px-5 py-10 scrollbar-thin">
            {/* CSS cho Webkit Scrollbar */}
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-thin::-webkit-scrollbar { width: 6px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}} />
        
            <div className="mx-auto max-w-[850px]">
                {/* Thanh thông báo template */}
                {formData.sourceID && (
                    <div className="mb-[25px] flex items-center justify-between rounded-xl border border-[#FFD1D8] bg-[#FFF1F3] px-5 py-3 text-[#FF6B81]">
                        <span className="text-sm">✨ Nội dung đã được tự động điền từ phôi.</span>
                        <button 
                           onClick={() => setFormData({
                                ...formData, 
                                sourceID: null,
                                content: '',           // Xóa nội dung câu hỏi
                                explanation: '',       // Xóa lời giải
                                answers: [             // Reset về 2 đáp án trống mặc định
                                    { answerText: '', isCorrect: true },
                                    { answerText: '', isCorrect: false }
                                ],
                                
                            })}
                            className="bg-none text-sm font-bold cursor-pointer border-none"
                        >
                            Xóa phôi
                        </button>
                    </div>
                )}
                {/* CHỌN LOẠI CÂU HỎI (QUESTION TYPE) */}
                <div className="mb-[30px]">
                    <label className="mb-3 block font-bold text-[#4A5568]">Dạng câu hỏi</label>
                    <div className="flex gap-2.5">
                        {[
                            { value: QuestionType.MultipleChoice, label: 'Chọn từ', icon: '📝' },
                            { value: QuestionType.FillInBlank, label: 'Điền từ', icon: '⌨️' },
                            { value: QuestionType.Ordering, label: 'Sắp xếp câu', icon: '🧩' },
                            { value: QuestionType.Synonym, label: 'Từ đồng nghĩa', icon: '🔄' },
                            { value: QuestionType.Usage, label: 'Cách dùng', icon: '📖' }
                        ].map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, questionType: type.value })}
                                className={`flex flex-1 flex-col items-center gap-[5px] rounded-xl border-2 p-3 font-bold transition-all cursor-pointer
                                    ${formData.questionType === type.value 
                                        ? 'border-[#FF6B81] bg-[#FFF1F3] text-[#FF6B81]' 
                                        : 'border-[#E2E8F0] bg-white text-[#64748B]'}`}
                            >
                                <span className="text-xl">{type.icon}</span>
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* CHỌN KỸ NĂNG (SKILL TYPE) */}
                <div className="mb-[30px]">
                    <label className="mb-3 block font-bold text-[#4A5568]">Loại kĩ năng</label>
                    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                        {SKILL_TYPE_OPTIONS
                        .filter(skill => skill.value >= 1 && skill.value <= 3) 
                        .map((skill) => (
                            <button
                                key={skill.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, skillType: skill.value })}
                                className={`flex flex-col items-center justify-center rounded-xl border p-2 text-[13px] font-bold transition-all cursor-pointer
                                    ${Number(formData.skillType) === skill.value 
                                        ? 'border-[#FF6B81] bg-[#FFF1F3] text-[#FF6B81]' 
                                        : 'border-[#E2E8F0] bg-white text-[#64748B]'}`}
                            >
                                {skill.label}
                            </button>
                        ))}
                    </div>
                </div>

               <form>
                    {/* Rich Text Editor */}
                    <div className="mb-[25px]">
                        <label className="mb-2.5 block font-bold text-[#4A5568]">Nội dung câu hỏi (Rich Text)</label>
                        <div className="overflow-hidden rounded-xl border border-[#FFD1D8] bg-white">
                            <textarea 
                                className="min-h-[120px] w-full border-none p-[15px] text-lg outline-none"
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                placeholder="Nhập nội dung câu hỏi..."
                            />
                        </div>
                    </div>

                    {/* Topic Tags */}
                    <div className="mb-[25px]">
                        <label className="mb-2.5 block font-bold text-[#4A5568]">🏷️ Chủ đề (Topic Tags)</label>
                        <div className="min-h-[60px] rounded-xl border border-[#FFD1D8] bg-white p-[15px]">
                            <div className={`flex flex-wrap gap-2 ${formData.topicIds.length > 0 ? 'mb-[15px]' : ''}`}>
                                {formData.topicIds.length === 0 && (
                                    <span className="text-sm italic text-[#A0AEC0]">Chưa chọn chủ đề nào...</span>
                                )}
                                {formData.topicIds.map(id => {
                                    const topic = topics.find(t => t.topicID === id);
                                    return (
                                        <span key={id} className="flex items-center gap-1.5 rounded-[20px] bg-[#FF6B81] px-3 py-1.5 text-[13px] font-medium text-white shadow-[0_2px_4px_rgba(255,107,129,0.2)]">
                                            {topic ? topic.topicName : "..."}
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveTag(id)} 
                                                className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/20 text-sm text-white cursor-pointer border-none"
                                            >×</button>
                                        </span>
                                    );
                                })}
                            </div>

                            {formData.topicIds.length > 0 && <hr className="my-2.5 border-none border-t border-[#FFF1F3]" />}

                            <div className="mt-2.5">
                                <p className="mb-2 text-[12px] font-medium text-[#718096]">Gợi ý chủ đề:</p>
                                <div className="flex flex-wrap gap-2">
                                    {topics
                                        .filter(t => !formData.topicIds.includes(t.topicID))
                                        .map(t => (
                                            <button 
                                                key={t.topicID} 
                                                type="button"
                                                onClick={() => handleAddTag(t.topicID)}
                                                className="rounded-[20px] border border-dashed border-[#FFD1D8] bg-[#FFF8F9] px-3 py-[5px] text-[12px] font-medium text-[#FF6B81] transition-all hover:border-solid hover:bg-[#FF6B81] hover:text-white cursor-pointer"
                                            >
                                                + {t.topicName}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EXPLANATION (Lời giải chi tiết) */}
                    <div className="mb-[25px]">
                        <label className="mb-2.5 block font-bold text-[#4A5568]">
                            💡 Lời giải chi tiết (Explanation)
                        </label>
                        <div className="overflow-hidden rounded-xl border border-[#FFD1D8] bg-white transition-all focus-within:border-[#FF6B81] focus-within:shadow-[0_0_0_1px_#FF6B81]">
                            <textarea 
                                className="min-h-[100px] w-full border-none p-[15px] text-base outline-none placeholder:text-[#A0AEC0]"
                                value={formData.explanation} // Đảm bảo đã khai báo explanation trong state formData
                                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                                placeholder="Giải thích tại sao đáp án này đúng hoặc cung cấp thêm kiến thức mở rộng..."
                            />
                            {/* Thanh trạng thái nhỏ dưới ô textarea */}
                            <div className="bg-[#FFF8F9] px-4 py-2 text-[11px] text-[#FF6B81] border-t border-[#FFF1F3]">
                                {formData.sourceID ? "✓ Đã tự động lấy nội dung từ Meaning của phôi." : "Ý tưởng: Giải thích cấu trúc ngữ pháp hoặc từ vựng này."}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mb-[30px] flex gap-5">
                        {/* Độ khó */}
                        <div className="flex-1">
                            <label className="mb-2 block font-bold">
                                Độ khó: <span className="text-[#FF6B81]">{DIFFICULTY_OPTIONS.find(opt => opt.value === formData.difficulty)?.label || 'N5'}</span>
                            </label>
                            <div className="flex gap-[5px] text-2xl text-[#FF6B81]">
                                {[1,2,3].map(s => (
                                    <span key={s} onClick={() => setFormData({...formData, difficulty: s})} className="cursor-pointer">
                                        {s <= formData.difficulty ? '★' : '☆'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Câu hỏi tương đương */}
                        <div className="relative flex-1">
                            <label className="mb-2 block font-bold text-[#4A5568]">
                                🔗 Câu hỏi tương đương {isSearching && <span className="text-xs text-[#FF6B81]">(Đang tìm...)</span>}
                            </label>
                            
                            {formData.equivalentID ? (
                                <div className="flex items-center justify-between rounded-lg border border-[#C6F6D5] bg-[#F0FFF4] p-2.5">
                                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[#2F855A]">
                                        ✅ Đã liên kết: {selectedEquivalentContent}
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => { setFormData({...formData, equivalentID: null}); setSelectedEquivalentContent(null); }}
                                        className="font-bold text-[#E53E3E] bg-none border-none cursor-pointer"
                                    >✕</button>
                                </div>
                            ) : (
                                <input 
                                    className="w-full rounded-lg border border-[#DDD] p-2.5 text-sm outline-none focus:border-[#FF6B81]" 
                                    placeholder="Tìm theo nội dung câu hỏi đã có..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            )}

                            {/* Suggestions Dropdown */}
                            {suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white shadow-lg">
                                    {suggestions.map((item) => (
                                        <div 
                                            key={item.questionID} 
                                            onClick={() => handleSelectEquivalent(item)}
                                            className="cursor-pointer border-b border-[#F1F5F9] p-[12px_15px] transition-all hover:bg-[#FFF5F7]"
                                        >
                                            <div className="mb-1 flex justify-between">
                                                <span className="rounded-[4px] bg-[#FFF1F3] px-1.5 py-[2px] text-[11px] font-bold uppercase text-[#FF6B81]">
                                                    {QUESTION_TYPE_LABELS[item.questionType as QuestionType] || "N/A"}
                                                </span>
                                                <span className="text-[11px] text-[#94A3B8]">#...{item.questionID.slice(-6)}</span>
                                            </div>
                                            <div className="line-clamp-2 text-sm font-medium leading-relaxed text-[#1E293B]">
                                                {item.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <AnswerEditor 
                        answers={formData.answers} 
                        setAnswers={(newAns) => setFormData({...formData, answers: newAns})} 
                    />

                    {/* Nút hành động */}
                        <div className="mt-10 flex justify-end gap-[15px] pb-10">
                            <button 
                                type="button" 
                                onClick={() => processSubmit(QuestionStatus.Draft)}
                                className="cursor-pointer rounded-lg border-none bg-[#E2E8F0] px-[25px] py-3 font-bold hover:bg-[#CBD5E1] transition-all"
                            >
                                {/* Biến đổi text dựa trên chế độ Edit */}
                                {isEditMode ? "Cập nhật bản nháp" : "Lưu nháp"}
                            </button>

                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    processSubmit(QuestionStatus.Active);
                                }}
                                className="cursor-pointer rounded-lg border-none bg-[#FF6B81] px-10 py-3 font-bold text-white shadow-[0_4px_12px_rgba(255,107,129,0.3)] hover:opacity-90 transition-all"
                            >
                                <span>{isEditMode ? "✓" : "➤"}</span> 
                                <span className="ml-2">
                                    {isEditMode ? "Cập nhật câu hỏi" : "Tạo câu hỏi chính thức"}
                                </span>
                            </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);
};

export default QuestionCreatePage;