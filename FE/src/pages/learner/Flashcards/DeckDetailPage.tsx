import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { FlashcardItemDTO } from '../../../interfaces/Learner/Flashcard';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

const DeckDetailPage: React.FC = () => {
    const { deckID } = useParams<{ deckID: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const activeFilter = useMemo(() => {
        const q = searchParams.get('type');
        if (q != null && !Number.isNaN(Number(q))) return Number(q) as SkillType;
        const st = (location.state as { filterState?: SkillType } | null)?.filterState;
        if (st != null) return st;
        return SkillType.Vocabulary;
    }, [searchParams, location.state]);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<FlashcardItemDTO[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'learning'>('all');

    useEffect(() => {
        const fetchDeckItems = async () => {
            if (!deckID) return;
            setLoading(true);
            try {
                const data = await FlashcardService.getDeckItems(deckID);
                setItems(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Lỗi khi tải chi tiết bộ thẻ:', error);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDeckItems();
    }, [deckID]);

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.kanji?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.meaning?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ? true : filterStatus === 'mastered' ? item.isMastered : !item.isMastered;
        return matchesSearch && matchesStatus;
    });

    /** Kỹ năng thật của bộ thẻ (ưu tiên dữ liệu API; khi chưa có thẻ thì theo filter URL). */
    const deckSkillType = useMemo((): SkillType => {
        if (items.length > 0) {
            const t = Number(items[0].itemType);
            if (!Number.isNaN(t)) return t as SkillType;
        }
        return activeFilter;
    }, [items, activeFilter]);

    const getSkillStyle = (type: SkillType) => {
        switch (Number(type)) {
            case SkillType.Vocabulary:
                return {
                    iconBg: 'bg-[#f287b6]/10',
                    iconColor: 'text-[#f287b6]',
                    headerIcon: 'translate' as const,
                    cardBorder: 'border-[rgba(242,135,182,0.22)]',
                    theadRow: 'bg-[#fdf5f9] border-b border-[#f4e0eb]',
                    rowHover: 'hover:bg-[#fdf5f9]/70',
                    rowLeftBorder: 'border-l-[3px] border-l-[#f287b6]',
                    efClass: 'text-[#f287b6]',
                };
            case SkillType.Kanji:
                return {
                    iconBg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                    headerIcon: 'edit_note' as const,
                    cardBorder: 'border-emerald-200/90',
                    theadRow: 'bg-emerald-50/90 border-b border-emerald-100',
                    rowHover: 'hover:bg-emerald-50/40',
                    rowLeftBorder: 'border-l-[3px] border-l-emerald-500',
                    efClass: 'text-emerald-600',
                };
            case SkillType.Grammar:
                return {
                    iconBg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                    headerIcon: 'format_list_bulleted' as const,
                    cardBorder: 'border-amber-200/90',
                    theadRow: 'bg-amber-50/90 border-b border-amber-100',
                    rowHover: 'hover:bg-amber-50/40',
                    rowLeftBorder: 'border-l-[3px] border-l-amber-500',
                    efClass: 'text-amber-600',
                };
            default:
                return {
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-500',
                    headerIcon: 'style' as const,
                    cardBorder: 'border-gray-200',
                    theadRow: 'bg-[#fbf9fa] border-b border-[#f4f0f2]',
                    rowHover: 'hover:bg-[#fbf9fa]/60',
                    rowLeftBorder: 'border-l-[3px] border-l-gray-300',
                    efClass: 'text-primary',
                };
        }
    };

    const tableSpec = useMemo(() => {
        switch (Number(deckSkillType)) {
            case SkillType.Vocabulary:
                return {
                    primaryLabel: 'Từ vựng',
                    secondaryLabel: 'Nghĩa',
                    primaryPlaceholder: 'Tìm theo từ, hiragana, nghĩa...',
                    primaryCellClass: 'text-xl font-japanese font-black text-[#181114]',
                };
            case SkillType.Kanji:
                return {
                    primaryLabel: 'Hán tự',
                    secondaryLabel: 'Nghĩa & đọc',
                    primaryPlaceholder: 'Tìm theo chữ Hán, nghĩa...',
                    primaryCellClass: 'text-2xl font-japanese font-black text-[#181114] tracking-wide',
                };
            case SkillType.Grammar:
                return {
                    primaryLabel: 'Mẫu / cấu trúc',
                    secondaryLabel: 'Giải thích',
                    primaryPlaceholder: 'Tìm theo mẫu câu, nghĩa...',
                    primaryCellClass: 'text-sm font-bold text-[#181114] leading-snug',
                };
            default:
                return {
                    primaryLabel: 'Mặt trước',
                    secondaryLabel: 'Mặt sau',
                    primaryPlaceholder: 'Tìm theo từ, kanji, nghĩa...',
                    primaryCellClass: 'text-xl font-japanese font-black text-[#181114]',
                };
        }
    }, [deckSkillType]);

    const deckDescription = useMemo(() => {
        const t = Number(deckSkillType);
        if (t === SkillType.Vocabulary)
            return 'Từ vựng: theo dõi khoảng cách SRS, EF và lần ôn tiếp theo.';
        if (t === SkillType.Kanji)
            return 'Hán tự: ôn theo SM‑2; cột đầu là chữ, cột sau là nghĩa / gợi ý đọc.';
        if (t === SkillType.Grammar)
            return 'Ngữ pháp: mỗi hàng là một mẫu cấu trúc kèm giải thích ngắn.';
        return 'Theo dõi SRS, ngày ôn tiếp theo và trạng thái từng thẻ trong bộ.';
    }, [deckSkillType]);

    const SKILL_LABELS: Record<number, string> = {
        [SkillType.Vocabulary]: 'vocabulary',
        [SkillType.Grammar]: 'grammar',
        [SkillType.Kanji]: 'kanji',
    };

    const style = getSkillStyle(deckSkillType);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light font-['Lexend'] text-[#211118]">
            <LearnerHeader>
                <div className="flex items-center w-full gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            type="button"
                            onClick={() => navigate(`/learner/flashcards?type=${activeFilter}`)}
                            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-[#181114] uppercase">Flashcards</h2>
                            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                <span>{SKILL_LABELS[Number(deckSkillType)] || 'Tất cả'}</span>
                                <span>/</span>
                                <span className="text-primary font-bold">Chi tiết bộ thẻ</span>
                            </nav>
                        </div>
                    </div>
                </div>
            </LearnerHeader>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl ${style.iconBg} flex items-center justify-center ${style.iconColor}`}>
                                <span className="material-symbols-outlined text-3xl">{style.headerIcon}</span>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-[#211118] tracking-tight mb-2">Danh sách thẻ</h1>
                                <p className="text-[#534248] max-w-lg">{deckDescription}</p>
                            </div>
                        </div>
                    </header>

                    <section className="mb-8 flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white rounded-full border-none shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 outline-none"
                                placeholder={tableSpec.primaryPlaceholder}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'mastered' | 'learning')}
                            className="px-6 py-4 bg-white rounded-full border-none shadow-sm font-bold text-sm text-[#211118] focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="mastered">Đã thuộc</option>
                            <option value="learning">Đang học</option>
                        </select>
                    </section>

                    <div
                        className={`bg-white rounded-xl border shadow-sm overflow-hidden ${style.cardBorder}`}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[720px]">
                                <thead>
                                    <tr className={style.theadRow}>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#886373]">
                                            {tableSpec.primaryLabel}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#886373]">
                                            {tableSpec.secondaryLabel}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#886373]">
                                            Ôn SRS
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#886373]">
                                            EF
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#886373]">
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f4f0f2]">
                                    {filteredItems.map((item) => (
                                        <tr
                                            key={item.itemID || item.entityID}
                                            className={`${style.rowHover} transition-colors`}
                                        >
                                            <td className={`px-6 py-5 pl-5 ${style.rowLeftBorder}`}>
                                                <span className={tableSpec.primaryCellClass}>{item.kanji || '—'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span
                                                    className={
                                                        Number(deckSkillType) === SkillType.Grammar
                                                            ? 'text-sm text-[#534248] font-medium leading-relaxed line-clamp-3'
                                                            : 'text-sm font-bold text-[#181114]'
                                                    }
                                                >
                                                    {item.meaning || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-[#181114]">
                                                        {item.interval} ngày
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#886373]">
                                                        Tiếp theo:{' '}
                                                        {item.nextReview
                                                            ? new Date(item.nextReview).toLocaleDateString()
                                                            : '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-xs font-bold ${style.efClass}`}>
                                                    {Number.isFinite(item.ef) ? item.ef.toFixed(2) : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {item.isMastered ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                        Đã thuộc
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                        Đang học
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-3 block">
                                                    inbox
                                                </span>
                                                <p className="text-[#534248] font-medium">
                                                    {items.length === 0
                                                        ? 'Chưa có thẻ trong bộ này.'
                                                        : 'Không có thẻ nào phù hợp bộ lọc.'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeckDetailPage;
