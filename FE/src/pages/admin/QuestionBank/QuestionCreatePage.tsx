import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SourcePanel, { SOURCE_PANEL_TYPES } from '../../../components/Admin/QuestionEditor/SourcePanel';
import AnswerEditor from '../../../components/Admin/QuestionEditor/AnswerEditor';
import QuestionService from '../../../services/Admin/questionService';
import {
    CreateQuestionDTO,
    QuestionType,
    SourceMaterial,
    AnswerDTO,
    QuestionStatus,
    SkillType,
    LessonLookupDTO
} from '../../../interfaces/Admin/QuestionBank';
import { TopicItem } from '../../../interfaces/Admin/Topic';
import { DIFFICULTY_OPTIONS, QUESTION_TYPE_LABELS, SKILL_TYPE_OPTIONS } from '../../../constants/admin/questionOptions';
import { toast } from 'react-hot-toast';
import AdminHeader from '../../../components/layout/admin/AdminHeader';

const sectionLabelClass = 'mb-3 block text-xs font-bold uppercase tracking-wider text-[#886373]';
const fieldLabelClass = 'mb-2.5 block text-sm font-bold text-[#181114]';
const inputShellClass =
    'overflow-hidden rounded-xl border border-[#f4f0f2] bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20';

type QuestionVisibility = 'Published' | 'Draft' | 'Archived';

const QuestionCreatePage: React.FC = () => {
    const { id, lessonId } = useParams<{ id?: string; lessonId: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

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
        skillType: SkillType.Vocabulary
    });

    const [visibility, setVisibility] = useState<QuestionVisibility>('Published');
    const [lessons, setLessons] = useState<LessonLookupDTO[]>([]);
    const [saving, setSaving] = useState(false);

    const [topicSearch, setTopicSearch] = useState('');
    const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
    const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);
    const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
    const [isSourceLevelMenuOpen, setIsSourceLevelMenuOpen] = useState(false);
    const [isSourceTypeMenuOpen, setIsSourceTypeMenuOpen] = useState(false);
    const [dropUp, setDropUp] = useState({ lesson: false, visibility: false, sourceLevel: false, sourceType: false });

    const [sourceFilterLevel, setSourceFilterLevel] = useState('');
    const [sourceMaterialType, setSourceMaterialType] = useState('Vocabulary');
    const [sourceLibrarySearch, setSourceLibrarySearch] = useState('');

    const handleOpenDropdown = (type: 'lesson' | 'visibility' | 'sourceLevel' | 'sourceType', e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isCloseToBottom = windowHeight - rect.bottom < 400;
        setDropUp((prev) => ({ ...prev, [type]: isCloseToBottom }));
        if (type === 'lesson') setIsLessonMenuOpen(!isLessonMenuOpen);
        if (type === 'visibility') setIsVisibilityMenuOpen(!isVisibilityMenuOpen);
        if (type === 'sourceLevel') setIsSourceLevelMenuOpen(!isSourceLevelMenuOpen);
        if (type === 'sourceType') setIsSourceTypeMenuOpen(!isSourceTypeMenuOpen);
    };

    const applyLessonSelection = (lid: string, levelName: string) => {
        const matched = DIFFICULTY_OPTIONS.find((opt) => opt.label === levelName);
        setFormData((prev) => ({
            ...prev,
            lessonID: lid,
            difficulty: matched ? matched.value : prev.difficulty
        }));
    };

    useEffect(() => {
        const loadLessons = async () => {
            try {
                const data = await QuestionService.getLessonsLookup();
                setLessons(data || []);
            } catch (error) {
                console.error('Lỗi load lessons:', error);
            }
        };
        loadLessons();
    }, []);

    useEffect(() => {
        const loadQuestionData = async () => {
            if (isEditMode && id) {
                try {
                    const data = await QuestionService.getQuestionDetail(id);

                    setFormData({
                        lessonID: data.lessonID || '',
                        content: data.content || '',
                        questionType: data.questionType,
                        difficulty: data.difficulty,
                        explanation: data.explanation || '',
                        equivalentID: data.equivalentID || null,
                        sourceID: data.sourceID || null,
                        status: data.status,
                        topicIds: (data as any).questionTopics
                            ? (data as any).questionTopics.map((qt: any) => qt.topicID)
                            : (data.topicIds || []),
                        answers: data.answers || []
                    });

                    setVisibility(
                        data.status === QuestionStatus.Draft
                            ? 'Draft'
                            : data.status === QuestionStatus.Archived
                              ? 'Archived'
                              : 'Published'
                    );

                    if (data.equivalentID) {
                        const eqText = (data as any).equivalentContent ?? data.equivalentID;
                        setSelectedEquivalentContent(eqText);
                    }
                } catch (error) {
                    console.error('Lỗi khi tải chi tiết câu hỏi:', error);
                }
            }
        };
        loadQuestionData();
    }, [id, isEditMode]);

    const [topics, setTopicsLookup] = useState<TopicItem[]>([]);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data = await QuestionService.getTopicsLookup();
                setTopicsLookup(data);
            } catch (error) {
                console.error('Không thể load danh sách Topic', error);
            }
        };
        fetchTopics();
    }, []);

    const handlePickSource = (item: SourceMaterial, type: string) => {
        const getVal = (v: any) => {
            if (!v) return '';
            if (typeof v === 'string') return v;
            return v.content || v.translation || v.meaning || v.title || '';
        };

        const displayExample = () => {
            if (!item.example) return '';
            if (typeof item.example === 'string') return item.example;
            const ex = item.example as any;
            return ex.content ? `\n\nVí dụ: ${ex.content}${ex.translation ? ` (${ex.translation})` : ''}` : '';
        };

        let autoContent = '';
        let autoExplanation = getVal(item.meaning) + displayExample();
        let autoAnswers: AnswerDTO[] = [];
        let autoSkillType = SkillType.Vocabulary;

        switch (type) {
            case 'Vocabulary':
                autoSkillType = SkillType.Vocabulary;
                autoContent = `Chọn nghĩa đúng của từ: ${getVal(item.word)}`;
                autoAnswers = [
                    { answerText: getVal(item.meaning) || '', isCorrect: true },
                    { answerText: 'Nghĩa giả 1', isCorrect: false },
                    { answerText: 'Nghĩa giả 2', isCorrect: false }
                ];
                break;
            case 'Kanji':
                autoSkillType = SkillType.Kanji;
                autoContent = `Cách đọc Onyomi của chữ Hán "${getVal(item.character)}" là gì?`;
                autoAnswers = [
                    { answerText: getVal(item.onyomi) || '', isCorrect: true },
                    { answerText: 'Đáp án sai 1', isCorrect: false },
                    { answerText: 'Đáp án sai 2', isCorrect: false }
                ];
                break;

            case 'Grammar':
                autoSkillType = SkillType.Grammar;
                autoContent = `Hoàn thành cấu trúc ngữ pháp: ${getVal(item.structure) || getVal(item.title) || 'N/A'}`;
                autoAnswers = [
                    { answerText: getVal(item.meaning) || '', isCorrect: true },
                    { answerText: 'Đáp án sai 1', isCorrect: false },
                    { answerText: 'Đáp án sai 2', isCorrect: false },
                    { answerText: 'Đáp án sai 3', isCorrect: false }
                ];
                break;
        }

        setFormData((prev) => ({
            ...prev,
            content: autoContent,
            explanation: autoExplanation,
            sourceID: item.id,
            skillType: autoSkillType,
            answers: autoAnswers.length > 0 ? autoAnswers : prev.answers,
            topicIds: item.topicID ? [item.topicID] : prev.topicIds
        }));
    };

    const statusFromVisibility = (v: QuestionVisibility): QuestionStatus => {
        if (v === 'Draft') return QuestionStatus.Draft;
        if (v === 'Archived') return QuestionStatus.Archived;
        return QuestionStatus.Active;
    };

    const handleSave = async () => {
        const status = statusFromVisibility(visibility);

        if (!formData.lessonID) {
            toast.error('Vui lòng chọn bài học!');
            return;
        }

        if (status === QuestionStatus.Active) {
            const hasCorrect = formData.answers.some((a) => a.isCorrect);
            if (!hasCorrect) {
                toast.error('Câu hỏi đang hoạt động phải có ít nhất một đáp án đúng!');
                return;
            }
            if (!formData.content.trim()) {
                toast.error('Nội dung câu hỏi không được để trống!');
                return;
            }
        }

        setSaving(true);
        try {
            const payload = { ...formData, status } as any;

            let message = '';
            if (isEditMode && id) {
                await QuestionService.updateQuestion(id, payload);
                message = '🚀 Đã cập nhật câu hỏi thành công!';
            } else {
                await QuestionService.createQuestion(payload);
                message = '🚀 Đã lưu câu hỏi thành công!';
            }

            toast.success(message);
            setTimeout(() => navigate(-1), 1500);
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || 'Không thể lưu câu hỏi';
            toast.error('Lỗi: ' + errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedEquivalentContent, setSelectedEquivalentContent] = useState<string | null>(null);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await QuestionService.searchEquivalent(searchTerm);
                setSuggestions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Lỗi API Search:', error);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectEquivalent = (q: any) => {
        setFormData({ ...formData, equivalentID: q.questionID });
        setSelectedEquivalentContent(q.content);
        setSuggestions([]);
        setSearchTerm('');
    };

    const typeChipBase =
        'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-3 text-[13px] font-bold transition-all cursor-pointer';
    const typeChipOn = 'border-primary bg-primary/10 text-primary shadow-sm';
    const typeChipOff = 'border-[#f4f0f2] bg-white text-[#886373] hover:border-primary/30 hover:bg-[#fbf9fa]';

    const selectedLessonLabel =
        lessons.find((l) => l.lessonID === formData.lessonID)?.title || '-- Chọn bài học --';

    return (
        <div className="flex h-full min-h-0 min-w-[380px] flex-col overflow-hidden bg-background-light">
            <AdminHeader>
                <div className={isEditMode ? 'flex items-center gap-241' : 'flex items-center gap-254'}>
                    <div className="flex min-w-0 items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f4f0f2] text-[#886373] transition-colors hover:bg-[#f4f0f2] active:scale-95"
                            aria-label="Quay lại"
                        >
                            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                        </button>
                        <div className="flex min-w-0 flex-col text-left">
                            <h2 className="text-xl font-bold uppercase tracking-tight text-[#181114]">
                                {isEditMode ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}
                            </h2>
                            <nav className="flex flex-wrap gap-1 text-[10px] font-medium uppercase tracking-wider text-[#886373]">
                                <span>Ngân hàng câu hỏi</span>
                                <span>/</span>
                                <span className="font-bold text-primary">{isEditMode ? 'Chỉnh sửa' : 'Thêm mới'}</span>
                            </nav>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm">{saving ? 'sync' : 'save'}</span>
                            {saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
                        </button>
                    </div>
                </div>
            </AdminHeader>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-8">
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e8e0e4; border-radius: 10px; }
              `
                    }}
                />

                <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
                    {/* Hàng trên: thư viện phôi — full width, bố cục ngang */}
                    <div className="rounded-2xl border border-[#f4f0f2] bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-5 flex flex-col items-start gap-4 border-b border-[#f4f0f2] pb-5 md:flex-row md:items-center md:justify-between lg:gap-3">
                            <div className="flex min-w-0 shrink-0 items-center gap-2">
                                <span className="material-symbols-outlined shrink-0 text-primary">menu_book</span>
                                <h3 className="text-lg font-bold tracking-tight text-[#181114]">Thư viện tài liệu</h3>
                            </div>

                            <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:w-auto">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => handleOpenDropdown('sourceLevel', e)}
                                        className="flex h-10 min-w-34 items-center justify-between gap-2 rounded-full border border-[#f4f0f2] bg-[#fbf9fa] px-4 text-sm font-bold uppercase tracking-wide text-[#181114] transition-all hover:border-primary/30"
                                    >
                                        <span>{sourceFilterLevel || 'Tất cả JLPT'}</span>
                                        <span className={`material-symbols-outlined text-[18px] text-[#886373] transition-transform ${isSourceLevelMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>
                                    {isSourceLevelMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsSourceLevelMenuOpen(false)} />
                                            <div className={`absolute right-0 z-20 mt-2 w-40 rounded-xl border border-[#f4f0f2] bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${dropUp.sourceLevel ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSourceFilterLevel(''); setIsSourceLevelMenuOpen(false); }}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${sourceFilterLevel === '' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5 hover:text-primary'}`}
                                                >
                                                    Tất cả JLPT
                                                </button>
                                                {DIFFICULTY_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => { setSourceFilterLevel(opt.label); setIsSourceLevelMenuOpen(false); }}
                                                        className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${sourceFilterLevel === opt.label ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5 hover:text-primary'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => handleOpenDropdown('sourceType', e)}
                                        className="flex h-10 min-w-36 items-center justify-between gap-2 rounded-full border border-[#f4f0f2] bg-[#fbf9fa] px-4 text-sm font-bold text-[#181114] transition-all hover:border-primary/30"
                                    >
                                        <span>{SOURCE_PANEL_TYPES.find(opt => opt.value === sourceMaterialType)?.label || 'Loại phôi'}</span>
                                        <span className={`material-symbols-outlined text-[18px] text-[#886373] transition-transform ${isSourceTypeMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>
                                    {isSourceTypeMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsSourceTypeMenuOpen(false)} />
                                            <div className={`absolute right-0 z-20 mt-2 w-44 rounded-xl border border-[#f4f0f2] bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${dropUp.sourceType ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                                {SOURCE_PANEL_TYPES.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => { setSourceMaterialType(opt.value); setIsSourceTypeMenuOpen(false); }}
                                                        className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${sourceMaterialType === opt.value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5 hover:text-primary'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="relative">
                                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#886373]">
                                        search
                                    </span>
                                    <input
                                        type="search"
                                        placeholder="Tìm phôi..."
                                        value={sourceLibrarySearch}
                                        onChange={(e) => setSourceLibrarySearch(e.target.value)}
                                        className="h-10 w-full rounded-full border border-[#f4f0f2] bg-[#fbf9fa] pl-10 pr-4 text-sm font-medium text-[#181114] outline-none transition-all placeholder:text-[#886373]/55 focus:border-primary focus:ring-2 focus:ring-primary/15"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="min-h-[220px] lg:min-h-[260px]">
                            <SourcePanel
                                hideLessonSelect
                                currentLessonId={formData.lessonID}
                                filterLevel={sourceFilterLevel}
                                filterType={sourceMaterialType}
                                searchQuery={sourceLibrarySearch}
                                onPick={handlePickSource}
                                onLessonChange={(lid, levelName) => applyLessonSelection(lid, levelName)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Cột trái: dạng câu hỏi + biên tập */}
                    <div className="space-y-8 lg:col-span-2">
                        <div className="rounded-2xl border border-[#f4f0f2] bg-white p-8 shadow-sm">
                            {formData.sourceID && (
                                <div className="mb-8 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-5 py-3.5 text-primary">
                                    <span className="text-sm font-medium">Nội dung đã được điền tự động từ phôi.</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                sourceID: null,
                                                content: '',
                                                explanation: '',
                                                answers: [
                                                    { answerText: '', isCorrect: true },
                                                    { answerText: '', isCorrect: false }
                                                ]
                                            })
                                        }
                                        className="text-sm font-bold text-primary underline-offset-2 hover:underline"
                                    >
                                        Xóa phôi
                                    </button>
                                </div>
                            )}

                            <div className="mb-8">
                                <label className={sectionLabelClass}>Dạng câu hỏi</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {[
                                        { value: QuestionType.MultipleChoice, label: 'Chọn từ', icon: 'quiz' },
                                        { value: QuestionType.FillInBlank, label: 'Điền từ', icon: 'text_fields' },
                                        { value: QuestionType.Ordering, label: 'Sắp xếp', icon: 'swap_vert' },
                                        { value: QuestionType.Synonym, label: 'Đồng nghĩa', icon: 'compare_arrows' },
                                        { value: QuestionType.Usage, label: 'Cách dùng', icon: 'menu_book' }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, questionType: type.value })}
                                            className={`${typeChipBase} min-w-[100px] ${
                                                formData.questionType === type.value ? typeChipOn : typeChipOff
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[22px]">{type.icon}</span>
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className={sectionLabelClass}>Loại kĩ năng</label>
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                                    {SKILL_TYPE_OPTIONS.filter((skill) => skill.value >= 1 && skill.value <= 3).map((skill) => (
                                        <button
                                            key={skill.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, skillType: skill.value })}
                                            className={`rounded-xl border-2 p-2 text-center text-[12px] font-bold transition-all ${
                                                Number(formData.skillType) === skill.value ? typeChipOn : typeChipOff
                                            }`}
                                        >
                                            {skill.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                            >
                                <div className="mb-6">
                                    <label className={fieldLabelClass}>Nội dung câu hỏi</label>
                                    <div className={inputShellClass}>
                                        <textarea
                                            className="min-h-[120px] w-full resize-y border-none bg-transparent p-4 text-base text-[#181114] outline-none placeholder:text-[#886373]/60"
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="Nhập nội dung câu hỏi..."
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className={fieldLabelClass}>Lời giải chi tiết</label>
                                    <div className={inputShellClass}>
                                        <textarea
                                            className="min-h-[100px] w-full resize-y border-none bg-transparent p-4 text-[15px] text-[#181114] outline-none placeholder:text-[#886373]/60"
                                            value={formData.explanation}
                                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                            placeholder="Giải thích đáp án hoặc kiến thức mở rộng..."
                                        />
                                        <div className="border-t border-[#f4f0f2] bg-[#fbf9fa] px-4 py-2 text-[11px] font-medium text-[#886373]">
                                            {formData.sourceID
                                                ? 'Đã lấy gợi ý từ nghĩa của phôi.'
                                                : 'Gợi ý: giải thích ngữ pháp hoặc từ vựng liên quan.'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-8">
                                    <div className="flex-1">
                                        <label className={fieldLabelClass}>
                                            Độ khó (JLPT){' '}
                                            <span className="text-primary">
                                                {DIFFICULTY_OPTIONS.find((opt) => opt.value === formData.difficulty)?.label ||
                                                    'N5'}
                                            </span>
                                        </label>
                                        <div className="flex gap-1 text-2xl text-primary">
                                            {[1, 2, 3].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, difficulty: s })}
                                                    className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110"
                                                >
                                                    {s <= formData.difficulty ? '★' : '☆'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative flex-1">
                                        <label className={fieldLabelClass}>
                                            Câu hỏi tương đương
                                            {isSearching && (
                                                <span className="ml-2 text-xs font-normal normal-case text-primary">
                                                    (Đang tìm...)
                                                </span>
                                            )}
                                        </label>

                                        {formData.equivalentID ? (
                                            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5">
                                                <span className="truncate text-[13px] font-medium text-emerald-800">
                                                    Đã liên kết: {selectedEquivalentContent}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, equivalentID: null });
                                                        setSelectedEquivalentContent(null);
                                                    }}
                                                    className="shrink-0 font-bold text-red-500 hover:text-red-600"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <input
                                                className="w-full rounded-xl border border-[#f4f0f2] bg-white px-4 py-2.5 text-sm text-[#181114] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                placeholder="Tìm theo nội dung câu hỏi đã có..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        )}

                                        {suggestions.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-[#f4f0f2] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                                                {suggestions.map((item) => (
                                                    <div
                                                        key={item.questionID}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => handleSelectEquivalent(item)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleSelectEquivalent(item);
                                                            }
                                                        }}
                                                        className="cursor-pointer border-b border-[#f4f0f2] p-3 transition-colors last:border-b-0 hover:bg-primary/5"
                                                    >
                                                        <div className="mb-1 flex justify-between gap-2">
                                                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                                                                {QUESTION_TYPE_LABELS[item.questionType as QuestionType] || 'N/A'}
                                                            </span>
                                                            <span className="text-[10px] text-[#886373]">
                                                                #...{item.questionID.slice(-6)}
                                                            </span>
                                                        </div>
                                                        <div className="line-clamp-2 text-sm font-medium leading-snug text-[#181114]">
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
                                    setAnswers={(newAns) => setFormData({ ...formData, answers: newAns })}
                                />
                            </form>
                        </div>
                    </div>

                    {/* Cột phải: gán chủ đề, trạng thái, bài học */}
                    <div className="flex flex-col gap-8 lg:col-span-1">
                        <div className="rounded-2xl border border-[#f4f0f2] bg-white p-8 shadow-sm">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#886373]">
                                    Gán chủ đề
                                </label>
                                <div className="relative">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                                            search
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Tìm và chọn chủ đề..."
                                            value={topicSearch}
                                            onChange={(e) => {
                                                setTopicSearch(e.target.value);
                                                setIsTopicMenuOpen(true);
                                            }}
                                            onFocus={() => setIsTopicMenuOpen(true)}
                                            className="w-full rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        />
                                    </div>

                                    {isTopicMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsTopicMenuOpen(false)} />
                                            <div className="absolute left-0 right-0 z-20 mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#f4f0f2] bg-white p-1 shadow-xl custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {topics
                                                    .filter(
                                                        (t) =>
                                                            t.topicName.toLowerCase().includes(topicSearch.toLowerCase()) &&
                                                            !formData.topicIds.includes(t.topicID)
                                                    )
                                                    .map((t) => (
                                                        <button
                                                            key={t.topicID}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    topicIds: [...formData.topicIds, t.topicID]
                                                                });
                                                                setTopicSearch('');
                                                                setIsTopicMenuOpen(false);
                                                            }}
                                                            className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 hover:text-primary"
                                                        >
                                                            {t.topicName}
                                                            <span className="material-symbols-outlined text-xs opacity-0 transition-opacity group-hover:opacity-100">
                                                                add
                                                            </span>
                                                        </button>
                                                    ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                                    {formData.topicIds.map((tid) => (
                                        <div key={tid} className="group relative inline-flex animate-in zoom-in duration-200">
                                            <div className="flex items-center rounded-full border border-primary/20 bg-primary/5 py-1.5 pl-3 pr-8 text-[11px] font-bold text-primary">
                                                <span className="material-symbols-outlined mr-1.5 text-[14px] text-primary/60">
                                                    label
                                                </span>
                                                {topics.find((x) => x.topicID === tid)?.topicName || '...'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        topicIds: formData.topicIds.filter((x) => x !== tid)
                                                    })
                                                }
                                                className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary/20 text-primary transition-all hover:bg-primary hover:text-white group-hover:scale-100 scale-75"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 border-t border-[#f4f0f2] pt-6">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#886373]">
                                    Trạng thái
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => handleOpenDropdown('visibility', e)}
                                        className="flex w-full items-center justify-between rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] px-4 py-2.5 text-sm outline-none transition-all hover:border-primary/30"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`size-2 rounded-full ${
                                                    visibility === 'Published'
                                                        ? 'bg-green-500'
                                                        : visibility === 'Draft'
                                                          ? 'bg-amber-500'
                                                          : 'bg-red-500'
                                                }`}
                                            />
                                            <span className="font-bold text-[#181114]">
                                                {visibility === 'Published'
                                                    ? 'Hoạt động'
                                                    : visibility === 'Draft'
                                                      ? 'Bản nháp'
                                                      : 'Lưu trữ'}
                                            </span>
                                        </div>
                                        <span
                                            className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isVisibilityMenuOpen ? 'rotate-180' : ''}`}
                                        >
                                            expand_more
                                        </span>
                                    </button>

                                    {isVisibilityMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsVisibilityMenuOpen(false)} />
                                            <div
                                                className={`absolute left-0 right-0 z-20 rounded-xl border border-[#f4f0f2] bg-white p-1 shadow-xl animate-in fade-in duration-200 ${
                                                    dropUp.visibility
                                                        ? 'bottom-full mb-2 slide-in-from-bottom-2'
                                                        : 'top-full mt-2 slide-in-from-top-2'
                                                }`}
                                            >
                                                {(
                                                    [
                                                        { key: 'Published' as const, label: 'Hoạt động', dot: 'bg-green-500' },
                                                        { key: 'Draft' as const, label: 'Bản nháp', dot: 'bg-amber-500' },
                                                        { key: 'Archived' as const, label: 'Lưu trữ', dot: 'bg-red-500' }
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        onClick={() => {
                                                            setVisibility(opt.key);
                                                            setIsVisibilityMenuOpen(false);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 hover:text-primary"
                                                    >
                                                        <span className={`size-1.5 rounded-full ${opt.dot}`} />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t border-[#f4f0f2] pt-6">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#886373]">
                                    Bài học
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => handleOpenDropdown('lesson', e)}
                                        className="flex w-full items-center justify-between rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] px-4 py-2.5 text-sm outline-none transition-all hover:border-primary/30"
                                    >
                                        <span className={formData.lessonID ? 'font-medium text-[#181114]' : 'text-[#886373]/60'}>
                                            {selectedLessonLabel}
                                        </span>
                                        <span
                                            className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isLessonMenuOpen ? 'rotate-180' : ''}`}
                                        >
                                            expand_more
                                        </span>
                                    </button>

                                    {isLessonMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsLessonMenuOpen(false)} />
                                            <div
                                                className={`absolute left-0 right-0 z-20 rounded-xl border border-[#f4f0f2] bg-white p-1 shadow-2xl animate-in fade-in duration-200 ${
                                                    dropUp.lesson
                                                        ? 'bottom-full mb-2 slide-in-from-bottom-2'
                                                        : 'top-full mt-2 slide-in-from-top-2'
                                                }`}
                                            >
                                                <div className="custom-scrollbar max-h-72 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            applyLessonSelection('', '');
                                                            setIsLessonMenuOpen(false);
                                                        }}
                                                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-500 transition-colors hover:bg-red-50"
                                                    >
                                                        Không chọn bài học
                                                    </button>
                                                    <div className="my-1 h-px bg-[#f4f0f2]" />
                                                    {lessons.map((l) => (
                                                        <button
                                                            key={l.lessonID}
                                                            type="button"
                                                            onClick={() => {
                                                                applyLessonSelection(l.lessonID, l.levelName || '');
                                                                setIsLessonMenuOpen(false);
                                                            }}
                                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                                formData.lessonID === l.lessonID
                                                                    ? 'bg-primary/10 font-bold text-primary'
                                                                    : 'hover:bg-primary/5 hover:text-primary'
                                                            }`}
                                                        >
                                                            {l.title}
                                                            {formData.lessonID === l.lessonID && (
                                                                <span className="material-symbols-outlined text-sm">check</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
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
        </div>
    );
};

export default QuestionCreatePage;