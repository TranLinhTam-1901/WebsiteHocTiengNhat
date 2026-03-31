import React, { useEffect, useMemo, useState } from 'react';
import QuestionService from '../../../services/Admin/questionService';
import { LessonLookupDTO, SourceMaterial } from '../../../interfaces/Admin/QuestionBank';
import { SOURCE_TYPE_OPTIONS } from '../../../constants/admin/questionOptions';

export const SOURCE_PANEL_TYPES = SOURCE_TYPE_OPTIONS.filter((opt) =>
    ['Vocabulary', 'Kanji', 'Grammar'].includes(opt.value)
);

interface Props {
    onPick: (item: SourceMaterial, type: string) => void;
    onLessonChange: (lessonID: string, levelName: string) => void;
    currentLessonId: string;
    hideLessonSelect?: boolean;
    /** Trình độ lọc API (điều khiển từ trang cha, cùng hàng tiêu đề) */
    filterLevel: string;
    /** Loại phôi: Vocabulary | Kanji | Grammar */
    filterType: string;
    /** Lọc cục bộ theo chuỗi tìm */
    searchQuery: string;
}

const typeVisual = {
    Vocabulary: {
        label: 'Từ vựng',
        icon: 'dictionary' as const,
        card: 'border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white',
        badge: 'bg-emerald-100 text-emerald-800',
        accent: 'text-emerald-700'
    },
    Kanji: {
        label: 'Hán tự',
        icon: 'menu' as const,
        card: 'border-rose-100 bg-gradient-to-b from-rose-50/70 to-white',
        badge: 'bg-rose-100 text-rose-800',
        accent: 'text-rose-700'
    },
    Grammar: {
        label: 'Ngữ pháp',
        icon: 'account_tree' as const,
        card: 'border-violet-100 bg-gradient-to-b from-violet-50/70 to-white',
        badge: 'bg-violet-100 text-violet-800',
        accent: 'text-violet-700'
    }
};

function MaterialCard({
    item,
    type,
    onPick
}: {
    item: SourceMaterial;
    type: string;
    onPick: () => void;
}) {
    const v = typeVisual[type as keyof typeof typeVisual] || typeVisual.Vocabulary;

    const getVal = (v: any) => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        return v.content || v.translation || v.meaning || v.title || v.word || '—';
    };

    if (type === 'Kanji') {
        return (
            <div
                className={`flex w-[244px] h-[244px] shrink-0 snap-start flex-col rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${v.card}`}
            >
                <div className="mb-2 flex items-center justify-between gap-1">
                    <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-bold uppercase ${v.badge}`}>{v.label}</span>
                    <span className="material-symbols-outlined text-[18px] opacity-40 text-[#886373]">{v.icon}</span>
                </div>
                <div className="font-japanese py-1 text-center text-[40px] font-black leading-none text-[#181114]">
                    {getVal(item.character)}
                </div>
                <div className="mb-2 flex flex-wrap justify-center gap-1 text-[15px] text-[#886373]">
                    {item.onyomi && (
                        <span className="rounded bg-white/80 px-1.5 py-0.5 font-medium">音 {getVal(item.onyomi)}</span>
                    )}
                    {item.kunyomi && (
                        <span className="rounded bg-white/80 px-1.5 py-0.5 font-medium">訓 {getVal(item.kunyomi)}</span>
                    )}
                </div>
                <p className="mb-2 line-clamp-2 min-h-9 text-center text-[15px] leading-snug text-[#886373]">
                    {getVal(item.meaning)}
                </p>
                <button
                    type="button"
                    onClick={onPick}
                    className="mt-auto w-full rounded-lg bg-primary py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                >
                    Chọn phôi
                </button>
            </div>
        );
    }

    if (type === 'Grammar') {
        const renderExample = () => {
            if (!item.example) return null;
            if (typeof item.example === 'string') return item.example;
            const ex = item.example as any;
            return ex.content || ex.translation || '—';
        };

        return (
            <div
                className={`flex w-[244px] h-[244px] shrink-0 snap-start flex-col rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${v.card}`}
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-bold uppercase ${v.badge}`}>{v.label}</span>
                    <span className="material-symbols-outlined text-[18px] opacity-40 text-[#886373]">{v.icon}</span>
                </div>
                <p className="font-japanese mb-1.5 line-clamp-2 min-h-10 text-[25px] font-bold leading-snug text-[#181114]">
                    {getVal(item.structure) || getVal(item.title) || '—'}
                </p>
                <p className="mb-2 line-clamp-2 flex-1 text-[15px] leading-relaxed text-[#886373]">{getVal(item.meaning)}</p>
                <button
                    type="button"
                    onClick={onPick}
                    className="mt-auto w-full rounded-lg bg-primary py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                >
                    Chọn phôi
                </button>
            </div>
        );
    }

    /* Vocabulary (default) */
    return (
        <div
            className={`flex w-[244px] h-[244px] shrink-0 snap-start flex-col rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${v.card}`}
        >
            <div className="mb-2 flex items-center justify-between gap-1">
                <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-bold uppercase ${v.badge}`}>{v.label}</span>
                <span className="material-symbols-outlined text-[18px] opacity-40 text-[#886373]">{v.icon}</span>
            </div>
            <p className={`mb-1 line-clamp-2 min-h-10 text-[40px] font-bold leading-tight text-[#181114] ${v.accent}`}>
                {getVal(item.word)}
            </p>
            <p className="mb-2 line-clamp-2 flex-1 text-[15px] leading-snug text-[#886373]">{getVal(item.meaning)}</p>
            <button
                type="button"
                onClick={onPick}
                className="mt-auto w-full rounded-lg bg-primary py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
            >
                Chọn phôi
            </button>
        </div>
    );
}

const SourcePanel: React.FC<Props> = ({
    onPick,
    onLessonChange,
    currentLessonId,
    hideLessonSelect = false,
    filterLevel,
    filterType,
    searchQuery
}) => {
    const [lessons, setLessons] = useState<LessonLookupDTO[]>([]);
    const [materials, setMaterials] = useState<SourceMaterial[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const data = await QuestionService.getLessonsLookup();
                setLessons(data);
            } catch (error) {
                console.error('Lỗi load lessons:', error);
            }
        };
        fetchLessons();
    }, []);

    useEffect(() => {
        const fetchSource = async () => {
            try {
                setLoading(true);
                setMaterials([]);
                const data = await QuestionService.getSourceMaterials(
                    currentLessonId || '',
                    filterType,
                    filterLevel || ''
                );
                setMaterials(data || []);
            } catch (error) {
                console.error('Lỗi lấy phôi:', error);
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSource();
    }, [currentLessonId, filterType, filterLevel]);

    useEffect(() => {
        if (hideLessonSelect) return;

        const isCurrentLessonInLevel = lessons.some(
            (l) => l.lessonID === currentLessonId && l.levelName === filterLevel
        );

        if (!isCurrentLessonInLevel && filterLevel !== '') {
            onLessonChange('', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterLevel, hideLessonSelect, lessons, currentLessonId]);

    const handleSelectLesson = (id: string) => {
        const lesson = lessons.find((l) => l.lessonID === id);
        onLessonChange(id, lesson?.levelName || '');
    };

    const filteredMaterials = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return materials;
        return materials.filter((m) => {
            const getFieldVal = (val: any) => {
                if (!val) return '';
                if (typeof val === 'string') return val;
                if (typeof val === 'object') {
                    return [val.content, val.translation, val.meaning, val.title]
                        .filter(Boolean)
                        .join(' ');
                }
                return String(val);
            };

            const blob = [
                m.word,
                m.character,
                m.structure,
                m.title,
                m.meaning,
                m.example,
                m.onyomi,
                m.kunyomi
            ]
                .map(getFieldVal)
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return blob.includes(q);
        });
    }, [materials, searchQuery]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            {!hideLessonSelect && (
                <div className="shrink-0 rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] p-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#886373]">
                        Bài học
                    </label>
                    <select
                        className="w-full rounded-lg border border-[#f4f0f2] bg-white p-2.5 text-sm text-[#181114] outline-none focus:border-primary"
                        value={currentLessonId}
                        onChange={(e) => handleSelectLesson(e.target.value)}
                    >
                        <option value="">-- Chọn bài học --</option>
                        {lessons
                            .filter((l) => !filterLevel || l.levelName === filterLevel)
                            .map((l) => (
                                <option key={l.lessonID} value={l.lessonID}>
                                    {l.title}
                                </option>
                            ))}
                    </select>
                </div>
            )}

            <div className="flex min-h-[200px] min-w-0 flex-1 flex-col">
                {loading ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#f4f0f2] bg-[#fbf9fa]/80 py-10">
                        <p className="flex items-center gap-2 text-sm font-medium text-primary">
                            <span className="material-symbols-outlined animate-pulse text-[22px]">hourglass_top</span>
                            Đang tải phôi...
                        </p>
                    </div>
                ) : filteredMaterials.length > 0 ? (
                    <div className="custom-scroll-x -mx-0.5 flex flex-1 gap-3 overflow-x-auto overflow-y-hidden px-0.5 pb-2 pt-0.5">
                        {filteredMaterials.map((item) => (
                            <MaterialCard
                                key={item.id}
                                item={item}
                                type={filterType}
                                onPick={() => onPick(item, filterType)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#f4f0f2] bg-[#fbf9fa]/50 px-4 py-10 text-center">
                        <span className="material-symbols-outlined mb-2 text-3xl text-[#886373]/35">search_off</span>
                        <p className="text-sm font-semibold text-[#181114]">
                            {materials.length > 0 ? 'Không khớp tìm kiếm' : 'Chưa có phôi phù hợp'}
                        </p>
                        <p className="mt-1 max-w-sm text-xs text-[#886373]">
                            {materials.length > 0
                                ? 'Thử từ khóa khác hoặc xóa ô tìm kiếm.'
                                : 'Chọn bài học hoặc đổi trình độ / loại phôi.'}
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scroll-x::-webkit-scrollbar { height: 6px; }
                .custom-scroll-x::-webkit-scrollbar-thumb { background: #e8e0e4; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default SourcePanel;