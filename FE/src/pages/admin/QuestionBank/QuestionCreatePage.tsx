import React, { useState, useEffect } from 'react'; // Đảm bảo có useEffect ở đây
import { useParams, useNavigate } from 'react-router-dom';
import SourcePanel from '../../../components/Admin/QuestionEditor/SourcePanel';
import AnswerEditor from '../../../components/Admin/QuestionEditor/AnswerEditor';
import QuestionService from '../../../services/Admin/QuestionService';
import { CreateQuestionDTO, QuestionType, SourceMaterial, AnswerDTO, Topics, QuestionStatus } from '../../../interfaces/Admin/QuestionBank';
import { QUESTION_TYPE_OPTIONS, DIFFICULTY_OPTIONS, QUESTION_TYPE_LABELS } from '../../../constants/admin/questionOptions';

const QuestionCreatePage: React.FC = () => {
    // --- 1. HOOKS (Luôn để trên cùng) ---
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    

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
        audioURL: '',
        mediaTimestamp: 0
    });
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
        let autoAnswers: AnswerDTO[] = [];

        switch (type) {
            case 'Vocabulary':
                autoContent = `Chọn nghĩa đúng của từ: ${item.word}`;
                autoAnswers = [
                    { answerText: item.meaning || '', isCorrect: true },
                    { answerText: 'Nghĩa giả 1', isCorrect: false },
                    { answerText: 'Nghĩa giả 2', isCorrect: false },
                ];
                break;
            case 'Kanji':
                autoContent = `Cách đọc Onyomi của chữ Hán "${item.character}" là gì?`;
                break;
        }

        setFormData(prev => ({
            ...prev,
            content: autoContent,
            sourceID: item.id,
            audioURL: item.audioURL || '',
            mediaTimestamp: (item as any).mediaTimestamp || 0,
            answers: autoAnswers.length > 0 ? autoAnswers : prev.answers,
            topicIds: item.topicID ? [item.topicID] : prev.topicIds
        }));
    };

    const processSubmit = async (status: QuestionStatus) => {
    // Validate cơ bản cho cả 2 trường hợp
    if (!formData.lessonID) {
        alert("Vui lòng chọn bài học trước khi lưu!");
        return;
    }

    // Validate nâng cao khi chọn "Tạo chính thức" (Active)
    if (status === QuestionStatus.Active) {
        const hasCorrect = formData.answers.some(a => a.isCorrect);
        if (!hasCorrect) {
            alert("Câu hỏi chính thức phải có ít nhất một đáp án đúng!");
            return;
        }
        if (!formData.content.trim()) {
            alert("Nội dung câu hỏi không được để trống!");
            return;
        }
    }

    try {
        // Gộp status trực tiếp vào payload để gửi đi
        const payload = { ...formData, status,mediaTimestamp: String(formData.mediaTimestamp || "0") }as any;;
        
        await QuestionService.createQuestion(payload);
        
        const message = status === QuestionStatus.Draft 
            ? "✨ Đã lưu bản nháp thành công!" 
            : "🚀 Đã tạo câu hỏi chính thức thành công!";
        
        alert(message);
        navigate(-1);
    } catch (error: any) {
        const errorMsg = error.response?.data?.detail || "Không thể lưu câu hỏi";
        alert("Lỗi: " + errorMsg);
    }
    };

    // 2. Hàm xử lý sự kiện Submit của Form (dành cho nút chính thức)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processSubmit(QuestionStatus.Active);
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
    <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100%', 
        backgroundColor: '#F4F7FE', 
        overflow: 'hidden' 
    }}>
        
        {/* CỘT 1: MATERIAL LIBRARY - Tăng nhẹ width để thoải mái hơn */}
        <div style={{ 
            width: '380px',
            minWidth: '380px', 
            borderRight: '1px solid #E8E8E8', 
            backgroundColor: '#FFF', 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            boxShadow: '4px 0 10px rgba(0,0,0,0.03)'
        }}>
            <div style={{ padding: '24px 15px', flexShrink: 0 }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2D3748' }}>
                    <span style={{ marginRight: '8px' }}>📕</span> Material Library
                </h3>
                {/* SourcePanel bây giờ tự lo phần Select bài học & Level */}
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

        {/* CỘT 2: QUESTION EDITOR - Nền hồng nhẹ, cuộn độc lập */}
        <div style={{ 
            flex: 1, 
            overflowY: 'auto', // Chỉ cuộn ở đây
            backgroundColor: '#FFF8F9', // Nền hồng nhẹ theo yêu cầu
            padding: '40px 20px',
            scrollbarWidth: 'thin', // Dành cho Firefox để thanh cuộn nhỏ lại
            msOverflowStyle: 'none'
        }}>
            <style>{`
            div::-webkit-scrollbar { width: 6px; }
            div::-webkit-scrollbar-thumb { background: #E2E8F0; borderRadius: 10px; }
        `}</style>
        
            <div style={{ maxWidth: '850px  ', margin: '0 auto' }}>
                {/* Thanh thông báo template */}
                {formData.sourceID && (
                    <div style={{ background: '#FFF1F3', padding: '12px 20px', borderRadius: '12px', color: '#FF6B81', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #FFD1D8' }}>                       
                     <span style={{ fontSize: '14px' }}>✨ Nội dung đã được tự động điền từ phôi.</span>
                        <button onClick={() => setFormData({...formData, sourceID: null})} style={{ background: 'none', border: 'none', color: '#FF6B81', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Xóa phôi</button>                    
                    </div>
                )}
                {/* CHỌN LOẠI CÂU HỎI (QUESTION TYPE) */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px', color: '#4A5568' }}>
                        Dạng câu hỏi
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: formData.questionType === type.value ? '#FF6B81' : '#E2E8F0',
                                    backgroundColor: formData.questionType === type.value ? '#FFF1F3' : '#FFF',
                                    color: formData.questionType === type.value ? '#FF6B81' : '#64748B',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{type.icon}</span>
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Rich Text Editor giả lập */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#4A5568' }}>Nội dung câu hỏi (Rich Text)</label>
                        <div style={{ border: '1px solid #FFD1D8', borderRadius: '12px', backgroundColor: '#fff', overflow: 'hidden' }}>
                            <div style={{ padding: '10px', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: '15px' }}>
                                {/* Bạn có thể tích hợp thư viện Quill hoặc CKEditor ở đây */}
                                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><b>B</b></button>
                                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><i>I</i></button>
                                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🖼️</button>
                            </div>
                            <textarea 
                                style={{ width: '100%', minHeight: '120px', padding: '15px', border: 'none', outline: 'none', fontSize: '16px' }}
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                placeholder="Nhập nội dung câu hỏi..."
                            />
                        </div>
                    </div>

                    {/* Cấu trúc hiển thị Topic Tags mới */}
                   <div className="tag-management">                  
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#4A5568' }}>
                            🏷️ Chủ đề (Topic Tags)
                        </label>
                        
                        <div style={{ 
                            background: '#FFF', 
                            border: '1px solid #FFD1D8', 
                            borderRadius: '12px', 
                            padding: '15px',
                            minHeight: '60px'
                        }}>
                            {/* 1. Khu vực các nhãn đã chọn (Active Tags) */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: formData.topicIds.length > 0 ? '15px' : '0' }}>
                                {formData.topicIds.length === 0 && (
                                    <span style={{ color: '#A0AEC0', fontSize: '14px', fontStyle: 'italic' }}>Chưa chọn chủ đề nào...</span>
                                )}
                                {formData.topicIds.map(id => {
                                    const topic = topics.find(t => t.topicID === id);
                                    return (
                                        <span key={id} style={{ 
                                            background: '#FF6B81', 
                                            color: '#FFF', 
                                            padding: '6px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontWeight: '500',
                                            boxShadow: '0 2px 4px rgba(255, 107, 129, 0.2)'
                                        }}>
                                            {topic ? topic.topicName : "..."}
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveTag(id)} 
                                                style={{ 
                                                    border: 'none', 
                                                    background: 'rgba(255,255,255,0.2)', 
                                                    color: '#FFF', 
                                                    cursor: 'pointer',
                                                    borderRadius: '50%',
                                                    width: '18px',
                                                    height: '18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Ngăn cách nhẹ */}
                            {formData.topicIds.length > 0 && <hr style={{ border: 'none', borderTop: '1px solid #FFF1F3', margin: '10px 0' }} />}

                            {/* 2. Khu vực Gợi ý (Topic Bank) */}
                            <div style={{ marginTop: '10px' }}>
                                <p style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>
                                    Gợi ý chủ đề:
                                </p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {topics
                                        .filter(t => !formData.topicIds.includes(t.topicID)) // Chỉ hiện những cái chưa chọn
                                        .map(t => (
                                            <button 
                                                key={t.topicID} 
                                                type="button"
                                                onClick={() => handleAddTag(t.topicID)}
                                                style={{ 
                                                    border: '1px dashed #FFD1D8', 
                                                    background: '#FFF8F9', 
                                                    color: '#FF6B81',
                                                    padding: '5px 12px',
                                                    borderRadius: '20px', 
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    transition: 'all 0.2s',
                                                    fontWeight: '500'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = '#FF6B81';
                                                    e.currentTarget.style.color = '#FFF';
                                                    e.currentTarget.style.borderStyle = 'solid';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = '#FFF8F9';
                                                    e.currentTarget.style.color = '#FF6B81';
                                                    e.currentTarget.style.borderStyle = 'dashed';
                                                }}
                                            >
                                                + {t.topicName}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
            
                </div>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                Độ khó: <span style={{color:'#FF6B81'}}>{DIFFICULTY_OPTIONS.find(opt => opt.value === formData.difficulty)?.label || 'N5'}</span></label>
                            <div style={{ display: 'flex', gap: '5px', fontSize: '24px', color: '#FF6B81' }}>
                                {[1,2,3].map(s => (
                                    <span key={s} onClick={() => setFormData({...formData, difficulty: s})} style={{ cursor: 'pointer' }}>{s <= formData.difficulty ? '★' : '☆'}</span>
                                ))}
                            </div>
                        </div>

                       {/* Câu hỏi tương đương */}
                       <div style={{ flex: 1, position: 'relative' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#4A5568' }}>
                                🔗 Câu hỏi tương đương {isSearching && <span style={{ fontSize: '12px', color: '#FF6B81' }}>(Đang tìm...)</span>}
                            </label>
                            
                            {/* Khu vực hiển thị kết quả đã chọn */}
                            {formData.equivalentID ? (
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px', background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: '8px' 
                                }}>
                                    <span style={{ fontSize: '13px', color: '#2F855A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        ✅ Đã liên kết: {selectedEquivalentContent}
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => { setFormData({...formData, equivalentID: null}); setSelectedEquivalentContent(null); }}
                                        style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontWeight: 'bold' }}
                                    >✕</button>
                                </div>
                            ) : (
                                /* Ô input tìm kiếm */
                                <input 
                                    style={{ width: '100%', padding: '10px', border: '1px solid #DDD', borderRadius: '8px', fontSize: '14px' }} 
                                    placeholder="Tìm theo nội dung câu hỏi đã có..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            )}

                            {/* Dropdown gợi ý */}
                            {suggestions.length > 0 && (
                                <div style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0, 
                                    backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 100, marginTop: '4px',
                                    maxHeight: '200px', overflowY: 'auto'
                                }}>
                                    {suggestions.map((item: any) => (
    <div 
        key={item.questionID} 
        onClick={() => handleSelectEquivalent(item)}
        style={{ 
            padding: '12px 15px', 
            cursor: 'pointer', 
            borderBottom: '1px solid #F1F5F9',
            transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFF5F7'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
    >
        {/* Hàng 1: Loại câu hỏi và Badge trạng thái */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                textTransform: 'uppercase',
                color: '#FF6B81',
                backgroundColor: '#FFF1F3',
                padding: '2px 6px',
                borderRadius: '4px'
            }}>
                {QUESTION_TYPE_LABELS[item.questionType as QuestionType] || "N/A"}
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>#...{item.questionID.slice(-6)}</span>
        </div>

        {/* Hàng 2: Nội dung câu hỏi chính */}
        <div style={{ 
            color: '#1E293B', 
            fontSize: '14px', 
            fontWeight: '500',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
        }}>
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

                    {/* Nút hành động cố định ở cuối form */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '40px', paddingBottom: '40px' }}>

                        <button type="button" onClick={() => processSubmit(QuestionStatus.Draft)}
                        style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#E2E8F0', fontWeight: 'bold', cursor: 'pointer' }}>Lưu nháp</button>
                        <button type="submit" style={{ padding: '12px 40px', borderRadius: '10px', border: 'none', background: '#FF6B81', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 107, 129, 0.3)' }}>
                           <span>➤</span> Tạo câu hỏi chính thức
                        </button>


                    </div>

                </form>
            </div>
        </div>
    </div>
);
};

export default QuestionCreatePage;