import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { useTimer } from '../../../hooks/useTimer';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { FlashcardContentDTO, FlashcardReviewDTO } from '../../../interfaces/Learner/Flashcard';

const MAX_SENTENCE_EXAMPLES = 2;
const MAX_KANJI_RELATED_VOCAB = 3;

type CardVariant = {
    label: string;
    colorBg: string;
    badgeClass: string;
    frontRing: string;
    backTint: string;
    accentLine: string;
};

const cardVariant = (type: SkillType): CardVariant => {
    switch (Number(type)) {
        case SkillType.Vocabulary:
            return {
                label: 'Từ vựng',
                colorBg: 'bg-[#f287b6]',
                badgeClass: 'bg-[#f287b6]/15 text-[#f287b6] border-[#f287b6]/25',
                frontRing: 'border-[#f287b6]/22',
                backTint: 'from-[#fff5f9] to-[#fdf8fa]',
                accentLine: 'bg-[#f287b6]/25',
            };
        case SkillType.Kanji:
            return {
                label: 'Hán tự',
                colorBg: 'bg-emerald-500',
                badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
                frontRing: 'border-emerald-500/20',
                backTint: 'from-emerald-50/50 to-[#f4faf8]',
                accentLine: 'bg-emerald-500/25',
            };
        case SkillType.Grammar:
            return {
                label: 'Ngữ pháp',
                colorBg: 'bg-amber-500',
                badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
                frontRing: 'border-amber-500/20',
                backTint: 'from-amber-50/50 to-[#fffbf2]',
                accentLine: 'bg-amber-500/25',
            };
        default:
            return {
                label: 'Thẻ',
                colorBg: 'bg-gray-100',
                badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
                frontRing: 'border-gray-200',
                backTint: 'from-gray-50 to-white',
                accentLine: 'bg-gray-300/40',
            };
    }
};

/** Chọn giọng tiếng Nhật nếu trình duyệt có (bắt buộc để TTS không câm/im lặng trên nhiều máy Windows/Chrome). */
function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const norm = (lang: string) => lang?.toLowerCase().replace(/_/g, '-') || '';
    return (
        voices.find((v) => norm(v.lang) === 'ja-jp') ||
        voices.find((v) => norm(v.lang).startsWith('ja')) ||
        voices.find((v) => /日本|japanese|nihongo|kyoto|osaka|tokyo|sayuri|kyoko/i.test(`${v.name} ${v.lang}`))
    );
}

/**
 * Phát TTS tiếng Nhật: hủy queue cũ, chờ voices nếu cần (Chrome), gán voice ja-*.
 */
function speakJapanese(text: string): void {
    const t = text.trim();
    if (!t || typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    const run = () => {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(t);
        u.lang = 'ja-JP';
        const voice = pickJapaneseVoice(synth.getVoices());
        if (voice) u.voice = voice;
        u.rate = 0.92;
        u.pitch = 1;
        u.onerror = (e) => console.warn('speechSynthesis error', e);
        synth.speak(u);
    };

    if (synth.getVoices().length > 0) {
        run();
        return;
    }

    let settled = false;
    const finish = () => {
        synth.removeEventListener('voiceschanged', onVoices);
        if (settled) return;
        settled = true;
        run();
    };
    const onVoices = () => finish();

    synth.addEventListener('voiceschanged', onVoices);
    void synth.getVoices();
    requestAnimationFrame(() => {
        if (synth.getVoices().length > 0) finish();
    });
    window.setTimeout(finish, 500);
}

function firstReadingChunk(raw: string | undefined): string {
    const s = raw?.trim();
    if (!s || s === '—') return '';
    const part = s.split(/[、，,\s/／]+/).map((x) => x.trim()).find(Boolean);
    return part || s;
}

/** Chuỗi tối ưu cho TTS: ưu tiên hiragana/katakana/reading, tránh chỉ gửi kanji khi có đọc âm. */
function buildFlashcardTtsText(
    itemType: SkillType,
    entity: FlashcardContentDTO,
    grammarStructure: string
): string {
    switch (Number(itemType)) {
        case SkillType.Vocabulary: {
            const reading = entity.furigana?.trim();
            const word = entity.kanji?.trim();
            return reading || word || '';
        }
        case SkillType.Kanji: {
            const ku = firstReadingChunk(entity.kunyomi);
            const on = firstReadingChunk(entity.onyomi);
            const ch = entity.kanji?.trim();
            return ku || on || ch || '';
        }
        case SkillType.Grammar: {
            const g = grammarStructure.replace(/—/g, '').trim();
            return g || entity.kanji?.trim() || '';
        }
        default:
            return entity.kanji?.trim() || '';
    }
}

const FlashcardReviewPage: React.FC = () => {
    const { deckID } = useParams<{ deckID: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const studyMode =
        searchParams.get('mode')
        || (location.state as { studyMode?: string } | undefined)?.studyMode
        || 'learn';
    
    // Retrieve the previous filter state to go back to the exact list view
    const filterState = location.state?.filterState;

    const { time, resetTimer, stopTimer } = useTimer();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<FlashcardReviewDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showFurigana, setShowFurigana] = useState(false);
    const [sessionStats, setSessionStats] = useState({ done: 0, wrong: 0 });

    const fetchItems = useCallback(async () => {
        if (!deckID) return;
        setLoading(true);
        try {
            const data = await FlashcardService.getReviewsByDeck(deckID, studyMode);
            setItems(data);
            resetTimer();
        } catch (error) {
            console.error("Lỗi khi tải thẻ ôn tập:", error);
        } finally {
            setLoading(false);
        }
    }, [deckID, studyMode, resetTimer]);

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
                setShowFurigana(false);
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

    useEffect(() => {
        setShowFurigana(false);
    }, [currentIndex, items]);

    const handleBack = () => {
        // filterState ở đây chính là activeFilter bạn đã truyền sang
        const typeQuery = filterState !== undefined ? `?type=${filterState}` : '';
        
        navigate(`/learner/flashcards${typeQuery}`, { 
            // Vẫn giữ state để hỗ trợ logic Sidebar hoặc các logic cũ nếu cần
            state: { skillType: filterState }, 
            replace: true
        });
    };

    const activeItem = items.length > 0 ? items[Math.min(currentIndex, items.length - 1)] : undefined;
    const activeEntity: FlashcardContentDTO = activeItem?.entity ?? ({} as FlashcardContentDTO);
    const variant = cardVariant(activeItem?.itemType ?? SkillType.Vocabulary);
    const sentenceExamples = (activeEntity.examples ?? []).slice(0, MAX_SENTENCE_EXAMPLES);
    const kanjiRelatedVocab = (activeEntity.examples ?? []).slice(0, MAX_KANJI_RELATED_VOCAB);
    const grammarStructure = activeEntity.furigana?.trim() || '—';

    const skillTypeLabel = activeItem?.itemType === SkillType.Vocabulary ? 'Từ vựng'
        : activeItem?.itemType === SkillType.Kanji ? 'Hán tự'
        : activeItem?.itemType === SkillType.Grammar ? 'Ngữ pháp' : 'Thẻ';

    const sessionCrumb =
        studyMode === 'review' ? 'Ôn tập SRS'
            : studyMode === 'continue' ? 'Học các thẻ còn lại'
            : 'Học các thẻ mới';

    const ttsText = useMemo(() => {
        if (!activeItem) return '';
        return buildFlashcardTtsText(activeItem.itemType, activeEntity, grammarStructure);
    }, [
        activeItem?.itemID,
        activeItem?.itemType,
        activeEntity.kanji,
        activeEntity.furigana,
        activeEntity.kunyomi,
        activeEntity.onyomi,
        grammarStructure,
    ]);

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

    const currentItem = activeItem!;
    const entity = activeEntity;

    const progressPercent = ((currentIndex) / items.length) * 100;

    return (
        <div className="flex flex-col h-full bg-background-light text-[#211118] font-['Lexend']">
            <LearnerHeader>
                <div className="flex items-center w-full gap-4">
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
                            <span className="text-primary font-bold">{sessionCrumb}</span>
                            </nav>
                        </div>
                    </div>
                </div>
            </LearnerHeader>

            <main className="flex-1 flex flex-col p-6 md:p-10 max-w-5xl mx-auto w-full overflow-hidden">
                {/* Contextual Header & Progress */}
                <div className="mb-10 text-center">
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs font-bold mb-4 tracking-wider uppercase ${variant.badgeClass}`}>
                        Thẻ ghi nhớ • {skillTypeLabel}
                    </div>
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
                <div className="relative flex-1 flex flex-col items-center justify-center">
                    {/* Decorative Sakura Pedals */}
                    <div className="absolute top-10 left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Card Container with Perspective */}
                    <div
                        className="w-full max-w-2xl min-h-[440px] md:min-h-[480px] h-[min(520px,58vh)] perspective-1000 cursor-pointer z-10"
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        <div
                            key={currentItem.itemID}
                            className={`relative w-full h-full min-h-[inherit] transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'hover:scale-[1.01]'}`}
                        >
                            {/* Front */}
                            <div
                                className={`absolute inset-0 flex flex-col items-center justify-center p-8 md:p-10 backface-hidden rounded-[1.75rem] border-2 shadow-[0_12px_40px_rgba(0,0,0,0.06)] ${variant.frontRing} bg-white/95 backdrop-blur-md`}
                            >
                                <p className="absolute top-5 left-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Mặt trước</p>
                                <span className={`text-sm font-extrabold px-4 py-2 rounded-full border uppercase tracking-widest ${variant.badgeClass}`}>
                                    {variant.label}
                                </span>

                                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg gap-5 py-6">
                                    {currentItem.itemType === SkillType.Vocabulary && (
                                        <>
                                            <p className="sr-only">Từ vựng (chữ viết)</p>
                                            <h3
                                                lang="ja"
                                                className="text-6xl md:text-[5rem] font-black text-slate-900 tracking-tight text-center leading-none wrap-break-word"
                                            >
                                                {entity.kanji || '—'}
                                            </h3>
                                            <div className="flex flex-col items-center gap-3 min-h-14">
                                                {entity.furigana ? (
                                                    <>
                                                        {showFurigana && (
                                                            <p
                                                                lang="ja"
                                                                className="text-3xl md:text-4xl font-bold text-slate-600 text-center leading-snug"
                                                            >
                                                                {entity.furigana}
                                                            </p>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowFurigana((v) => !v);
                                                            }}
                                                            className={`px-6 py-2.5 rounded-2xl text-base font-bold transition-all border-2 shadow-sm ${
                                                                showFurigana
                                                                    ? 'bg-slate-200 border-slate-300 text-slate-800'
                                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-primary/5'
                                                            }`}
                                                        >
                                                            {showFurigana ? 'Ẩn Hiragana' : 'Hiện Hiragana'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-slate-400 font-medium">Chưa có Hiragana</p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {currentItem.itemType === SkillType.Kanji && (
                                        <>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Chữ Hán</p>
                                            <h3
                                                lang="ja"
                                                className="text-8xl md:text-9xl font-black text-slate-900 tracking-tight text-center leading-none"
                                            >
                                                {entity.kanji || '—'}
                                            </h3>
                                        </>
                                    )}

                                    {currentItem.itemType === SkillType.Grammar && (
                                        <>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cấu trúc ngữ pháp</p>
                                            <p
                                                lang="ja"
                                                className="text-2xl md:text-4xl font-bold text-slate-900 text-center leading-relaxed whitespace-pre-wrap px-2"
                                            >
                                                {grammarStructure}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {ttsText ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            speakJapanese(ttsText);
                                        }}
                                        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-black/5 text-base font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-2xl">volume_up</span>
                                        Nghe phát âm
                                    </button>
                                ) : null}
                            </div>

                            {/* Back */}
                            <div
                                className={`absolute inset-0 flex flex-col p-6 md:p-9 backface-hidden rotate-y-180 overflow-y-auto rounded-[1.75rem] border-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] scrollbar-hide bg-linear-to-b ${variant.backTint} ${variant.frontRing}`}
                            >
                                <p className="absolute top-5 left-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Mặt sau</p>

                                <div className="w-full flex flex-col gap-6 mt-7">
                                    {currentItem.itemType === SkillType.Vocabulary && (
                                        <>
                                            <div className="text-center space-y-3">
                                                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Ý nghĩa</p>
                                                <h3 className="text-2xl md:text-[1.75rem] font-black text-slate-900 leading-snug px-2">
                                                    {entity.meaning || 'Chưa có nghĩa'}
                                                </h3>
                                                <div className={`w-16 h-1.5 ${variant.accentLine} mx-auto rounded-full`} />
                                            </div>
                                            {sentenceExamples.length > 0 && (
                                                <div className="space-y-3">
                                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 text-center">
                                                        Câu ví dụ (tối đa 2)
                                                    </p>
                                                    <ul className="space-y-3">
                                                        {sentenceExamples.map((ex, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="bg-white/90 p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm text-left"
                                                            >
                                                                <p lang="ja" className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
                                                                    {ex.content}
                                                                </p>
                                                                <p className="text-base text-slate-600 mt-2 leading-snug border-t border-slate-100 pt-3">
                                                                    {ex.translation}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {currentItem.itemType === SkillType.Kanji && (
                                        <>
                                            <div className="text-center space-y-3">
                                                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Ý nghĩa</p>
                                                <h3 className="text-2xl md:text-[1.75rem] font-black text-slate-900 leading-snug px-2">
                                                    {entity.meaning || 'Chưa có nghĩa'}
                                                </h3>
                                                <div className={`w-16 h-1.5 ${variant.accentLine} mx-auto rounded-full`} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-white/90 rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 mb-2">Âm On</p>
                                                    <p lang="ja" className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                                                        {entity.onyomi?.trim() || '—'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/90 rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 mb-2">Âm Kun</p>
                                                    <p lang="ja" className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                                                        {entity.kunyomi?.trim() || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            {kanjiRelatedVocab.length > 0 && (
                                                <div className="space-y-3">
                                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 text-center">
                                                        Từ vựng có chứa chữ này
                                                    </p>
                                                    <ul className="space-y-3">
                                                        {kanjiRelatedVocab.map((ex, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="bg-white/90 p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 text-left"
                                                            >
                                                                <span lang="ja" className="text-xl md:text-2xl font-bold text-slate-900">
                                                                    {ex.content}
                                                                </span>
                                                                <span className="text-base text-slate-600 sm:text-right sm:max-w-[55%] leading-snug">
                                                                    {ex.translation}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {currentItem.itemType === SkillType.Grammar && (
                                        <>
                                            <div className="text-center space-y-3">
                                                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Ý nghĩa</p>
                                                <h3 className="text-2xl md:text-[1.75rem] font-black text-slate-900 leading-snug px-2">
                                                    {entity.meaning || 'Chưa có nghĩa'}
                                                </h3>
                                                <div className={`w-16 h-1.5 ${variant.accentLine} mx-auto rounded-full`} />
                                            </div>
                                            {sentenceExamples.length > 0 && (
                                                <div className="space-y-3">
                                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 text-center">
                                                        Câu ví dụ (tối đa 2)
                                                    </p>
                                                    <ul className="space-y-3">
                                                        {sentenceExamples.map((ex, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="bg-white/90 p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm text-left"
                                                            >
                                                                <p lang="ja" className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
                                                                    {ex.content}
                                                                </p>
                                                                <p className="text-base text-slate-600 mt-2 leading-snug border-t border-slate-100 pt-3">
                                                                    {ex.translation}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}
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
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 
                                ${variant.colorBg} ${variant.frontRing} 
                                group-hover:scale-105 group-active:scale-95`}
                            >
                                <span className="material-symbols-outlined text-4xl">
                                    {isFlipped ? 'visibility_off' : 'refresh'}
                                </span>
                            </div>
                            
                            <span className="text-lg font-black text-slate-800">
                                {isFlipped ? 'Úp lại' : 'Lật thẻ'}
                            </span>
                            
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