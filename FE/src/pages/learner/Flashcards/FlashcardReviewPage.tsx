import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { useTimer } from '../../../hooks/useTimer';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { FlashcardReviewDTO } from '../../../interfaces/Learner/Flashcard';

const FlashcardReviewPage: React.FC = () => {
    const { deckID } = useParams<{ deckID: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Retrieve the previous filter state to go back to the exact list view
    const filterState = location.state?.filterState;

    const { time, resetTimer, stopTimer } = useTimer();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<FlashcardReviewDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({ done: 0, wrong: 0 });

    const fetchItems = useCallback(async () => {
        if (!deckID) return;
        setLoading(true);
        try {
            const data = await FlashcardService.getReviewsByDeck(deckID);
            setItems(data);
            resetTimer();
        } catch (error) {
            console.error("Lỗi khi tải thẻ ôn tập:", error);
        } finally {
            setLoading(false);
        }
    }, [deckID, resetTimer]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSrsAction = async (quality: number) => {
        if (loading || !isFlipped) return;
        
        const item = items[currentIndex];
        const timeTaken = time;
        stopTimer();
        
        setLoading(true);
        try {
            await FlashcardService.updateProgress({
                itemId: item.itemID,
                quality,
                timeTaken
            });

            if (quality < 3) {
                setSessionStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
            }
            setSessionStats(prev => ({ ...prev, done: prev.done + 1 }));

            if (currentIndex < items.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
                resetTimer();
            } else {
                alert(`Hoàn thành phiên ôn tập! Bạn đã ôn ${items.length} thẻ.`);
                navigate('/learner/flashcards', { state: { filterState } });
            }
        } catch (err) {
            console.error("Lỗi khi cập nhật SRS:", err);
            alert("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (loading || items.length === 0) return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                setIsFlipped(prev => !prev);
            }

            if (isFlipped) {
                if (e.key === '1' || e.key.toLowerCase() === 'a') handleSrsAction(1); // Chưa thuộc
                if (e.key === '3' || e.key.toLowerCase() === 'd') handleSrsAction(4); // Đã thuộc
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, loading, items.length, currentIndex]);

    const playAudio = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        window.speechSynthesis.speak(utterance);
    };

    const handleBack = () => {
        navigate('/learner/flashcards', { 
            state: { skillType: filterState }, 
            replace: true
        });
    };

    if (loading && items.length === 0) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background-light p-8 text-center font-['Lexend']">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-dashed border-gray-200 max-w-md w-full">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
                    <h2 className="text-xl font-black text-[#181114] uppercase tracking-tight">Tuyệt vời!</h2>
                    <p className="text-[#534248] mt-2 font-medium">Hôm nay bạn không còn thẻ nào cần ôn tập trong bộ này.</p>
                    <button 
                        onClick={handleBack} 
                        className="mt-8 w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-lg transition-all"
                    >
                        Quay lại kho thẻ
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    const entity = currentItem.entity || {};

    const skillTypeLabel = currentItem.itemType === SkillType.Vocabulary ? 'Từ vựng' 
                         : currentItem.itemType === SkillType.Kanji ? 'Hán tự' 
                         : currentItem.itemType === SkillType.Grammar ? 'Ngữ pháp' : 'Thẻ';

    const progressPercent = ((currentIndex) / items.length) * 100;

    return (
        <div className="flex flex-col h-full bg-background-light text-[#211118] font-['Lexend']">
            <LearnerHeader>
                <div className= "flex items-center w-full gap-265">
                    <div className="flex items-center gap-4 flex-1">
                        <button 
                            onClick={handleBack}
                            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-[#181114] uppercase">
                                Flashcards
                            </h2>
                            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                            <span>{skillTypeLabel}</span>
                            <span>/</span>
                            <span className="text-primary font-bold">Ôn tập</span>
                            </nav>
                        </div>
                    </div>
                </div>
            </LearnerHeader>

            <main className="flex-1 flex flex-col p-6 md:p-10 max-w-5xl mx-auto w-full">
                {/* Contextual Header & Progress */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 tracking-wider uppercase">
                        Thẻ ghi nhớ • {skillTypeLabel}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-6">Ôn tập hệ thống SRS</h2>
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Tiến độ hôm nay</span>
                            <span className="text-sm font-black text-primary">{currentIndex + 1} / {items.length}</span>
                        </div>
                        <div className="h-3 w-full bg-[rgba(242,135,182,0.1)] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(242,135,182,0.4)] transition-all duration-500" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Central Flashcard Area */}
                <div className="relative flex-1 flex flex-col items-center justify-center perspective-1000">
                    {/* Decorative Sakura Pedals */}
                    <div className="absolute top-10 left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Main Card */}
                    <div 
                        className={`w-full max-w-2xl min-h-[360px] bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-primary/5 flex flex-col items-center justify-center p-12 text-center relative border border-[rgba(242,135,182,0.1)] cursor-pointer transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'hover:scale-[1.01]'}`}
                        onClick={() => !isFlipped && setIsFlipped(true)}
                        style={{ background: 'linear-gradient(135deg, rgba(242, 135, 182, 0.05) 0%, transparent 100%), rgba(255, 255, 255, 0.9)' }}
                    >
                        {/* Front Side */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 backface-hidden ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none opacity-20">
                                <div className="absolute top-4 right-4 text-primary">
                                    <span className="material-symbols-outlined text-4xl">filter_vintage</span>
                                </div>
                            </div>
                            <div className="space-y-4 w-full flex flex-col items-center">
                                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">{skillTypeLabel}</span>
                                <div className="py-4">
                                    <h3 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight wrap-break-word">{entity.kanji || '---'}</h3>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); playAudio(entity.kanji || ''); }}
                                    className="inline-flex items-center justify-center gap-2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">volume_up</span>
                                    <span className="text-xs font-medium italic">Nhấn để nghe phát âm</span>
                                </button>
                            </div>
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                                <div className="px-4 py-2 bg-slate-100/50 rounded-full flex items-center gap-2 animate-bounce">
                                    <span className="material-symbols-outlined text-sm">touch_app</span>
                                    <span className="text-xs font-bold text-slate-600">Chạm hoặc nhấn Space để lật thẻ</span>
                                </div>
                            </div>
                        </div>

                        {/* Back Side */}
                        <div className={`absolute inset-0 bg-[#fdf8fa] flex flex-col items-center justify-center p-12 backface-hidden rotate-y-180 overflow-y-auto rounded-2xl ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className="space-y-6 w-full py-4 text-center">
                                {entity.furigana && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Cách đọc / Cấu trúc</p>
                                            <p className="text-3xl font-medium text-slate-700">{entity.furigana}</p>
                                        </div>
                                        <div className="w-12 h-1 bg-primary/20 mx-auto rounded-full"></div>
                                    </>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Ý nghĩa</p>
                                    <h3 className="text-4xl font-black text-slate-900 leading-tight">{entity.meaning || 'Chưa có nghĩa'}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Cluster */}
                    <div className="mt-12 w-full max-w-2xl grid grid-cols-3 gap-6 relative z-10">
                        {/* Mark Unlearned */}
                        <button 
                            onClick={() => isFlipped ? handleSrsAction(1) : null}
                            disabled={!isFlipped || loading}
                            className={`flex flex-col items-center gap-2 group ${!isFlipped ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-[#ba1a1a] border border-[#ba1a1a]/10 transition-all duration-300 group-hover:scale-110 group-active:scale-90">
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 group-hover:text-[#ba1a1a] transition-colors">Chưa thuộc</span>
                            {isFlipped && <span className="text-[10px] text-slate-400 font-bold uppercase">(Phím 1)</span>}
                        </button>
                        
                        {/* Main Action (Flip/Next) */}
                        <button 
                            onClick={() => setIsFlipped(prev => !prev)}
                            className="flex flex-col items-center gap-3 group"
                        >
                            <div className="w-20 h-20 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white transition-all duration-300 group-hover:shadow-primary/50 group-hover:scale-105 group-active:scale-95">
                                <span className="material-symbols-outlined text-4xl">{isFlipped ? 'visibility_off' : 'refresh'}</span>
                            </div>
                            <span className="text-lg font-black text-slate-800">{isFlipped ? 'Úp lại' : 'Lật thẻ'}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">(Space)</span>
                        </button>
                        
                        {/* Mark Learned */}
                        <button 
                            onClick={() => isFlipped ? handleSrsAction(4) : null}
                            disabled={!isFlipped || loading}
                            className={`flex flex-col items-center gap-2 group ${!isFlipped ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-[#266c24] border border-[#266c24]/10 transition-all duration-300 group-hover:scale-110 group-active:scale-90">
                                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 group-hover:text-[#266c24] transition-colors">Đã thuộc</span>
                            {isFlipped && <span className="text-[10px] text-slate-400 font-bold uppercase">(Phím 3)</span>}
                        </button>
                    </div>
                </div>

            </main>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default FlashcardReviewPage;