import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, type NavigateFunction } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { DeckItemRefDto } from '../../../interfaces/Learner/Flashcard';

type AvailableCardRow = {
    id: string;
    text?: string;
    subText?: string;
    meaning?: string;
};

type SelectedEntry = { entityId: string; itemType: SkillType };

function parseFilterSkillType(raw: string | null): SkillType {
    if (raw == null || raw === '') return SkillType.Vocabulary;
    const n = Number(raw);
    if (n === SkillType.General) return SkillType.Vocabulary;
    if (n === SkillType.Vocabulary || n === SkillType.Kanji || n === SkillType.Grammar) return n;
    return SkillType.Vocabulary;
}

/** Tab danh sách bộ thẻ cần khôi phục (?type=) — không đổi khi user đổi filter loại thẻ trên form. */
function deckListReturnPath(searchParams: URLSearchParams): string {
    const listType =
        searchParams.get('listType') ?? searchParams.get('type') ?? searchParams.get('filter');
    if (listType !== null && listType !== '') {
        return `/learner/flashcards?type=${encodeURIComponent(listType)}`;
    }
    return '/learner/flashcards';
}

/** Giống nút Back trình duyệt khi có mục trước trong stack; tránh chồng thêm /flashcards. */
function goBackToDeckList(navigate: NavigateFunction, searchParams: URLSearchParams) {
    if (typeof window !== 'undefined' && window.history.length > 1) {
        navigate(-1);
        return;
    }
    navigate(deckListReturnPath(searchParams));
}

const DeckCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const editDeckId = searchParams.get('edit');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedType, setSelectedType] = useState<SkillType>(() =>
        parseFilterSkillType(searchParams.get('filter'))
    );
    const [levelId, setLevelId] = useState<string | null>(null);
    const [levelName, setLevelName] = useState('');
    const [profileLoading, setProfileLoading] = useState(true);
    const [availableCards, setAvailableCards] = useState<AvailableCardRow[]>([]);
    const [selectedEntries, setSelectedEntries] = useState<SelectedEntry[]>([]);
    // const [loading, setLoading] = useState(false);
    // const [editLoading, setEditLoading] = useState(false);
    // const [fetchingCards, setFetchingCards] = useState(false);
    // const [cardSearch, setCardSearch] = useState('');

    const setContentFilter = useCallback(
        (type: SkillType) => {
            setSelectedType(type);
            const next = new URLSearchParams(searchParams);
            next.set('filter', String(type));
            if (editDeckId) next.set('edit', editDeckId);
            setSearchParams(next, { replace: true });
        },
        [editDeckId, searchParams, setSearchParams]
    );

    useEffect(() => {
        if (editDeckId) return;
        setSelectedType(parseFilterSkillType(searchParams.get('filter')));
    }, [searchParams, editDeckId]);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCards, setFetchingCards] = useState(false);
    const [cardSearch, setCardSearch] = useState('');

    // useEffect(() => {
    //     setSelectedType(parseSkillFromUrl());
    // }, [urlType]);

    useEffect(() => {
        const loadProfile = async () => {
            setProfileLoading(true);
            try {
                const p = await LearnerProfileService.getCurrentProfile();
                if (p?.levelId) setLevelId(p.levelId);
                setLevelName(p?.levelName ?? '');
            } catch (e) {
                console.error('Không tải được hồ sơ:', e);
            } finally {
                setProfileLoading(false);
            }
        };
        loadProfile();
    }, []);

    // useEffect(() => {
    //     if (!editDeckId) return;
    //     let cancelled = false;
    //     (async () => {
    //         setEditLoading(true);
    //         try {
    //             const [decks, items] = await Promise.all([
    //                 FlashcardService.getDecks(),
    //                 FlashcardService.getDeckItems(editDeckId),
    //             ]);
    //             if (cancelled) return;
    //             const d = decks.find((x) => x.deckID === editDeckId);
    //             if (d) {
    //                 setName(d.skillName);
    //                 setDescription(d.description ?? '');
    //             }
    //             setSelectedEntries(
    //                 items.map((i) => ({ entityId: i.entityID, itemType: Number(i.itemType) as SkillType }))
    //             );
    //         } catch (e) {
    //             console.error(e);
    //             window.alert('Không tải được bộ thẻ để sửa.');
    //             navigate(deckListReturnPath(new URLSearchParams(window.location.search)));
    //         } finally {
    //             if (!cancelled) setEditLoading(false);
    //         }
    //     })();
    //     return () => {
    //         cancelled = true;
    //     };
    // }, [editDeckId, navigate]);

    useEffect(() => {
        const fetchAvailableCards = async () => {
            if (!levelId) return;
            setFetchingCards(true);
            try {
                const data = await FlashcardService.getAvailableEntities(levelId, selectedType, true);
                const raw = Array.isArray(data) ? data : [];
                const mapped: AvailableCardRow[] = raw
                    .map((item: Record<string, unknown>) => ({
                        id: String(item.id ?? item.Id ?? ''),
                        text: (item.text ?? item.Text) as string | undefined,
                        subText: (item.subText ?? item.SubText) as string | undefined,
                        meaning: (item.meaning ?? item.Meaning) as string | undefined,
                    }))
                    .filter((x) => x.id.length > 0);
                setAvailableCards(mapped);
            } catch (error) {
                console.error('Lỗi khi tải danh sách card:', error);
                setAvailableCards([]);
            } finally {
                setFetchingCards(false);
            }
        };
        fetchAvailableCards();
    }, [levelId, selectedType]);

    const filteredCards = useMemo(() => {
        if (!cardSearch.trim()) return availableCards;
        const q = cardSearch.toLowerCase();
        return availableCards.filter(
            (c) =>
                (c.text && c.text.toLowerCase().includes(q)) ||
                (c.subText && c.subText.toLowerCase().includes(q)) ||
                (c.meaning && c.meaning.toLowerCase().includes(q))
        );
    }, [availableCards, cardSearch]);

    const getSkillStyle = (type: SkillType) => {
        switch (Number(type)) {
            case SkillType.Vocabulary:
                return {
                    iconBg: 'bg-[#f287b6]/10',
                    iconColor: 'text-[#f287b6]',
                    chipActive: 'bg-[#f287b6] text-white shadow-md shadow-[#f287b6]/30',
                    chipIdle: 'bg-white text-[#211118] hover:bg-[#f287b6]/5 border border-[rgba(242,135,182,0.1)]',
                    accent: 'text-[#f287b6]',
                    buttonBg: 'bg-[#f287b6] text-white shadow-lg shadow-[#f287b6]/30 hover:shadow-[#f287b6]/50',
                };
            case SkillType.Kanji:
                return {
                    iconBg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                    chipActive: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
                    chipIdle: 'bg-white text-[#211118] hover:bg-emerald-500/5 border border-[rgba(16,185,129,0.1)]',
                    accent: 'text-emerald-600',
                    buttonBg: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50',
                };
            case SkillType.Grammar:
                return {
                    iconBg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                    chipActive: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
                    chipIdle: 'bg-white text-[#211118] hover:bg-amber-500/5 border border-[rgba(245,158,11,0.1)]',
                    accent: 'text-amber-600',
                    buttonBg: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50',
                };
            default:
                return {
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-500',
                    chipActive: 'bg-gray-700 text-white',
                    chipIdle: 'bg-white text-[#211118] border border-gray-200',
                    accent: 'text-gray-600',
                    buttonBg: 'bg-gray-700 text-white',
                };
        }
    };

    const SKILL_LABELS: Record<number, string> = {
        [SkillType.Vocabulary]: 'vocabulary',
        [SkillType.Grammar]: 'grammar',
        [SkillType.Kanji]: 'kanji',
    };

    const buildPayload = (): { name: string; description?: string; items: DeckItemRefDto[] } => ({
        name: name.trim(),
        description: description.trim() || undefined,
        items: selectedEntries.map((e) => ({
            entityId: e.entityId,
            itemType: e.itemType,
        })),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || selectedEntries.length === 0) {
            window.alert('Vui lòng nhập tên bộ thẻ và chọn ít nhất 1 thẻ.');
            return;
        }
        if (!levelId) {
            window.alert('Tài khoản chưa gán trình độ JLPT. Vui lòng cập nhật hồ sơ để tạo bộ thẻ.');
            return;
        }

        setLoading(true);
        try {
            const payload = buildPayload();
            if (editDeckId) {
                await FlashcardService.updateDeck(editDeckId, payload);
            } else {
                await FlashcardService.createDeck(payload);
            }
            navigate('/learner/flashcards?type=0');
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            const msg = ax?.response?.data?.message;
            console.error('Lỗi khi lưu bộ thẻ:', error);
            window.alert(typeof msg === 'string' ? msg : 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const toggleCardSelection = (entityId: string) => {
        setSelectedEntries((prev) => {
            const idx = prev.findIndex((e) => e.entityId === entityId && e.itemType === selectedType);
            if (idx >= 0) return prev.filter((_, i) => i !== idx);
            return [...prev, { entityId, itemType: selectedType }];
        });
    };

    const isCardSelected = (entityId: string) =>
        selectedEntries.some((e) => e.entityId === entityId && e.itemType === selectedType);

    const style = getSkillStyle(selectedType);
    const isEdit = Boolean(editDeckId);

    // if (profileLoading || (isEdit && editLoading)) {
    //     return (
    //         <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
    //             <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col h-full bg-background-light font-['Lexend'] text-[#211118]">
            <LearnerHeader>
                <div className="flex items-center w-full gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            type="button"
                            onClick={() => goBackToDeckList(navigate, searchParams)}
                            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-[#181114] uppercase">Flashcards</h2>
                            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                <span>{'Bộ thẻ của tôi'}</span>
                                <span>/</span>
                                <span className="text-primary font-bold">
                                    {isEdit ? 'Sửa bộ thẻ' : 'Tạo bộ thẻ'}
                                </span>
                            </nav>
                        </div>
                    </div>
                </div>
            </LearnerHeader>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {!levelId ? (
                        <div className="bg-white rounded-xl p-10 border border-dashed border-[rgba(242,135,182,0.3)] text-center">
                            <span className="material-symbols-outlined text-5xl text-amber-400 mb-4">warning</span>
                            <h3 className="text-lg font-bold text-[#211118]">Chưa có trình độ JLPT</h3>
                            <p className="text-[#534248] mt-2">Cập nhật hồ sơ để gán cấp độ trước khi tạo bộ thẻ.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white p-8 rounded-xl border border-[rgba(242,135,182,0.1)] shadow-sm space-y-6">
                                    <div className={`w-14 h-14 rounded-2xl ${style.iconBg} flex items-center justify-center ${style.iconColor}`}>
                                        <span className="material-symbols-outlined text-3xl">style</span>
                                    </div>

                                    <div className="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#886373] mb-1">
                                            Trình độ áp dụng
                                        </p>
                                        <p className="text-lg font-black text-[#211118]">{levelName || 'Đang tải...'}</p>
                                        <p className="text-xs text-[#534248] mt-1">Theo hồ sơ học viên — không chỉnh tay.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">
                                            Tên bộ thẻ *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="VD: Từ vựng ôn nhanh"
                                            className="w-full px-6 py-4 bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-full font-bold focus:border-primary focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">
                                            Mô tả
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Ghi chú ngắn (tuỳ chọn)..."
                                            className="w-full px-6 py-4 bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-2xl font-bold focus:border-primary focus:outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">
                                            Lọc ngân hàng
                                        </label>
                                        <div className="flex flex-col gap-2 mt-2">
                                            {[
                                                { type: SkillType.Vocabulary, label: 'Từ vựng' },
                                                { type: SkillType.Kanji, label: 'Hán tự' },
                                                { type: SkillType.Grammar, label: 'Ngữ pháp' },
                                            ].map((item) => (
                                                <button
                                                    key={item.type}
                                                    type="button"
                                                    onClick={() => setContentFilter(item.type)}
                                                    className={`py-3 px-6 rounded-full text-left font-bold transition-all mt-2 flex items-center justify-between shadow-sm ${
                                                        selectedType === item.type ? style.chipActive : style.chipIdle
                                                    }`}
                                                >
                                                    <span>{item.label}</span>
                                                    {selectedType === item.type ? (
                                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !name.trim() || selectedEntries.length === 0}
                                        className={`w-full py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] ${
                                            loading || !name.trim() || selectedEntries.length === 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : `${style.buttonBg}`
                                        }`}
                                    >
                                        {loading
                                            ? 'Đang lưu...'
                                            : isEdit
                                              ? `Cập nhật (${selectedEntries.length} thẻ)`
                                              : `Tạo với ${selectedEntries.length} thẻ`}
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-xl border border-[rgba(242,135,182,0.1)] shadow-sm overflow-hidden flex flex-col min-h-[520px] max-h-[828px]">
                                    <div className="p-6 border-b border-[#f4f0f2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-black text-[#181114] uppercase tracking-tight text-sm">
                                                Chọn mục trong ngân hàng
                                            </h3>
                                            <p className="text-xs text-[#534248] mt-1">
                                                Dữ liệu theo cấp {levelName}; có thể chọn cả mục đã nằm trong bộ khác.
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full self-start sm:self-center ${style.iconBg} ${style.accent}`}
                                        >
                                            Đã chọn {selectedEntries.length}
                                        </span>
                                    </div>

                                    <div className="px-6 pt-4">
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                search
                                            </span>
                                            <input
                                                value={cardSearch}
                                                onChange={(e) => setCardSearch(e.target.value)}
                                                className="w-full pl-12 pr-6 py-3 bg-[#fbf9fa] rounded-full border-none shadow-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="Lọc theo từ, kanji, nghĩa..."
                                                type="text"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        {fetchingCards ? (
                                            <div className="h-64 flex items-center justify-center">
                                                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            </div>
                                        ) : filteredCards.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center text-center text-[#534248]">
                                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">
                                                    inventory_2
                                                </span>
                                                <p className="font-bold text-[#211118]">Không có mục phù hợp</p>
                                                <p className="text-sm mt-1">Thử đổi bộ lọc ngân hàng hoặc tìm kiếm.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filteredCards.map((card) => {
                                                    const isSelected = isCardSelected(card.id);
                                                    return (
                                                        <button
                                                            key={card.id}
                                                            type="button"
                                                            onClick={() => toggleCardSelection(card.id)}
                                                            className={`p-5 rounded-xl border-2 text-left cursor-pointer transition-all flex items-start justify-between gap-3 group ${
                                                                isSelected
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-[rgba(242,135,182,0.12)] hover:border-primary/30 bg-white'
                                                            }`}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <span className="text-xl font-japanese font-black text-[#181114] block truncate">
                                                                    {card.text || '—'}
                                                                </span>
                                                                {card.subText ? (
                                                                    <span className="text-xs font-medium text-[#886373] block truncate mt-0.5">
                                                                        {card.subText}
                                                                    </span>
                                                                ) : null}
                                                                <span className="text-xs font-bold text-[#534248] mt-1 line-clamp-2 block">
                                                                    {card.meaning}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={`size-9 shrink-0 rounded-full flex items-center justify-center transition-all ${
                                                                    isSelected
                                                                        ? 'bg-primary text-white'
                                                                        : 'bg-[#fbf9fa] text-transparent group-hover:text-gray-300'
                                                                }`}
                                                            >
                                                                <span className="material-symbols-outlined text-lg">check</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeckCreatePage;
