import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { UserDeckDTO } from '../../../interfaces/Learner/Flashcard';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { useSearchParams } from 'react-router-dom';

const DeckListPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [decks, setDecks] = useState<UserDeckDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Lấy activeFilter từ URL thay vì từ State
    const activeFilter = searchParams.get('type') 
        ? Number(searchParams.get('type')) as SkillType 
        : SkillType.Vocabulary;

    // Hàm thay đổi filter sẽ cập nhật URL
    const handleFilterChange = (type: SkillType | undefined) => {
        if (type === undefined) {
            searchParams.delete('type');
        } else {
            searchParams.set('type', type.toString());
        }
        setSearchParams(searchParams);
    };

    const fetchDecks = async () => {
        setLoading(true);
        try {
            const data = await FlashcardService.getDecks();
            setDecks(data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách bộ thẻ:", error);
            setDecks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    // Logic lọc chuẩn theo SkillType (Enum)
    const filteredDecks = useMemo(() => {
        let result = decks;
        
        if (activeFilter !== undefined && activeFilter !== null) {
            result = result.filter(deck => Number(deck.skillType) === Number(activeFilter));
        }
        
        if (searchTerm.trim() !== '') {
            result = result.filter(deck => 
                deck.skillName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return result;
    }, [decks, activeFilter, searchTerm]);

    const getSkillIcon = (type: SkillType) => {
        switch (Number(type)) {
            case SkillType.Vocabulary: return 'translate';
            case SkillType.Grammar: return 'format_list_bulleted';
            case SkillType.Kanji: return 'edit_note';
            default: return 'style';
        }
    };
    
    const getSkillStyle = (type: SkillType) => {
        switch (Number(type)) {
            case SkillType.Vocabulary: 
                return {
                    iconBg: 'bg-[#f287b6]/10',
                    iconColor: 'text-[#f287b6]',
                    levelBg: 'bg-[#f287b6]/20',
                    levelColor: 'text-[#7b2652]',
                    progressColor: 'text-[#f287b6]',
                    progressBarBg: 'bg-[#f287b6]/10',
                    progressBar: 'bg-[#f287b6]',
                    buttonBg: 'bg-[#f287b6] text-white',
                    buttonShadow: 'shadow-lg shadow-[#f287b6]/30 hover:shadow-[#f287b6]/50'
                };
            case SkillType.Kanji: 
                return {
                    iconBg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                    levelBg: 'bg-emerald-100',
                    levelColor: 'text-emerald-900',
                    progressColor: 'text-emerald-600',
                    progressBarBg: 'bg-emerald-500/10',
                    progressBar: 'bg-emerald-500',
                    buttonBg: 'bg-emerald-500 text-white',
                    buttonShadow: 'shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                };
            case SkillType.Grammar: 
                return {
                    iconBg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                    levelBg: 'bg-amber-100',
                    levelColor: 'text-amber-900',
                    progressColor: 'text-amber-600',
                    progressBarBg: 'bg-amber-500/10',
                    progressBar: 'bg-amber-500',
                    buttonBg: 'bg-amber-500 text-white',
                    buttonShadow: 'shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                };
            case SkillType.Reading: 
                return {
                    iconBg: 'bg-blue-500/10',
                    iconColor: 'text-blue-500',
                    levelBg: 'bg-blue-100',
                    levelColor: 'text-blue-900',
                    progressColor: 'text-blue-600',
                    progressBarBg: 'bg-blue-500/10',
                    progressBar: 'bg-blue-500',
                    buttonBg: 'bg-blue-500 text-white',
                    buttonShadow: 'shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                };
            case SkillType.Listening: 
                return {
                    iconBg: 'bg-violet-500/10',
                    iconColor: 'text-violet-500',
                    levelBg: 'bg-violet-100',
                    levelColor: 'text-violet-900',
                    progressColor: 'text-violet-600',
                    progressBarBg: 'bg-violet-500/10',
                    progressBar: 'bg-violet-500',
                    buttonBg: 'bg-violet-500 text-white',
                    buttonShadow: 'shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50'
                };
            default: 
                return {
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-500',
                    levelBg: 'bg-gray-200',
                    levelColor: 'text-gray-900',
                    progressColor: 'text-gray-500',
                    progressBarBg: 'bg-gray-100',
                    progressBar: 'bg-gray-500',
                    buttonBg: 'bg-gray-500 text-white',
                    buttonShadow: ''
                };
        }
    };

    const SKILL_LABELS: Record<number, string> = {
        [SkillType.Vocabulary]: 'vocabulary',
        [SkillType.Grammar]: 'grammar',
        [SkillType.Kanji]: 'kanji',
    };

    const handleBackToHub = () => {
        const skillSlug = SKILL_LABELS[Number(activeFilter)] || 'vocabulary';
        navigate(`/learner/skill-learning/${skillSlug}`);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-light font-['Lexend'] text-[#211118]">
            <LearnerHeader>
                <div className= "flex items-center w-full gap-265">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={handleBackToHub}
                            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-[#181114] uppercase">
                                Flashcards
                            </h2>
                            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                {/* Hiển thị động tên kỹ năng dựa trên activeFilter */}
                                <span>{SKILL_LABELS[Number(activeFilter)] || 'Tất cả'}</span>
                                <span>/</span>
                                <span className="text-primary font-bold">Quản lý</span>
                            </nav>
                        </div>
                    </div>

                    {/* Add Button */}
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/learner/flashcards/create"
                            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                        >
                            <span className="material-symbols-outlined text-sm">style</span>
                            Thêm bộ thẻ
                        </Link>
                    </div>
                </div>
            </LearnerHeader>
            
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <header className="mb-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-[#211118] tracking-tight mb-2">Bộ Flashcards</h1>
                                <p className="text-[#534248] max-w-lg">Nâng cao vốn từ vựng, ngữ pháp và Kanji của bạn thông qua phương pháp lặp lại ngắt quãng (SRS).</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                                    <span className="text-sm font-bold">Chuỗi: 12 ngày</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Search & Filters */}
                    <section className="mb-12 flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:flex-1 group">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white rounded-full border-none shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 outline-none" 
                                placeholder="Tìm kiếm bộ thẻ..." 
                                type="text"
                            />
                        </div>
                        <div className="h-8 w-px bg-[rgba(242,135,182,0.1)] mx-2"></div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                            {/* Nút Từ vựng - Màu Hồng (Primary) */}
                            <button 
                                onClick={() => handleFilterChange(SkillType.Vocabulary)}
                                className={`px-6 py-4 rounded-full font-medium transition-all shadow-sm whitespace-nowrap ${
                                    activeFilter === SkillType.Vocabulary 
                                    ? 'bg-[#f287b6] text-white shadow-md font-bold shadow-[#f287b6]/30' 
                                    : 'bg-white text-[#211118] hover:bg-[#f287b6]/5 border border-[rgba(242,135,182,0.1)]'
                                }`}
                            >
                                Từ vựng
                            </button>

                            {/* Nút Hán tự - Màu Xanh lá (Emerald) */}
                            <button 
                                onClick={() => handleFilterChange(SkillType.Kanji)}
                                className={`px-6 py-4 rounded-full font-medium transition-all shadow-sm whitespace-nowrap ${
                                    activeFilter === SkillType.Kanji 
                                    ? 'bg-emerald-500 text-white shadow-md font-bold shadow-emerald-500/30' 
                                    : 'bg-white text-[#211118] hover:bg-emerald-500/5 border border-[rgba(16,185,129,0.1)]'
                                }`}
                            >
                                Hán tự
                            </button>

                            {/* Nút Ngữ pháp - Màu Vàng (Amber) */}
                            <button 
                                onClick={() => handleFilterChange(SkillType.Grammar)}
                                className={`px-6 py-4 rounded-full font-medium transition-all shadow-sm whitespace-nowrap ${
                                    activeFilter === SkillType.Grammar 
                                    ? 'bg-amber-500 text-white shadow-md font-bold shadow-amber-500/30' 
                                    : 'bg-white text-[#211118] hover:bg-amber-500/5 border border-[rgba(245,158,11,0.1)]'
                                }`}
                            >
                                Ngữ pháp
                            </button>
                        </div>
                    </section>

                    {/* Flashcard Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredDecks.length > 0 ? (
                            filteredDecks.map((deck) => {
                                const style = getSkillStyle(deck.skillType);
                                const mastered = Math.max(0, deck.totalCards - deck.dueCount - deck.newCards);
                                const progress = deck.totalCards > 0 ? (mastered / deck.totalCards) * 100 : 0;

                                return (
                                    <div 
                                        key={deck.deckID}
                                        className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-[rgba(242,135,182,0.1)] flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 rounded-2xl ${style.iconBg} flex items-center justify-center ${style.iconColor}`}>
                                                <span className="material-symbols-outlined text-3xl">{getSkillIcon(deck.skillType)}</span>
                                            </div>
                                            <span className={`${style.levelBg} ${style.levelColor} px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase`}>
                                                {deck.levelName || 'N/A'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#211118] mb-2">{deck.skillName}</h3>
                                        <p className="text-[#534248] text-sm mb-6 grow">
                                            {deck.topicName ? `Chủ đề: ${deck.topicName}` : 'Ôn tập kiến thức với hệ thống SRS để ghi nhớ dài hạn.'}
                                        </p>
                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-[#534248]">Tiến độ: {Math.round(progress)}%</span>
                                                <span className={style.progressColor}>{mastered}/{deck.totalCards} thẻ</span>
                                            </div>
                                            <div className={`w-full h-2 ${style.progressBarBg} rounded-full overflow-hidden`}>
                                                <div className={`h-full ${style.progressBar} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => navigate(
                                                    `/learner/flashcards/review/${deck.deckID}?type=${activeFilter}`,
                                                    { state: { filterState: activeFilter } }
                                                )}
                                                disabled={deck.totalCards === 0}
                                                className={`flex-1 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
                                                    deck.totalCards > 0 
                                                    ? `${style.buttonBg} ${style.buttonShadow} active:scale-95` 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                >
                                                Học ngay
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/learner/flashcards/deck/${deck.deckID}`)}
                                                className="w-14 h-14 rounded-full border border-[rgba(242,135,182,0.1)] flex items-center justify-center text-[#534248] hover:bg-background-light transition-all hover:text-primary active:scale-95"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-[rgba(242,135,182,0.3)]">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">style</span>
                                <h3 className="text-xl font-bold text-[#211118] tracking-tight">Trống trơn...</h3>
                                <p className="text-[#534248] font-medium mt-2">Không tìm thấy bộ thẻ nào phù hợp.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeckListPage;