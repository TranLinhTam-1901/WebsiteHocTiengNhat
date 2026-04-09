import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { learnerKanjiService, LearnerRadicalMetadata } from '../../../../services/Learner/learnerKanjiService';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { LearnerKanjiListItem } from '../../../../interfaces/Learner/StudyResource';

type FilterPageNumber = 1 | 2 | 3 | 4 | 5;

const StudyKanjiListPage: React.FC = () => {
  const [kanjiList, setKanjiList] = useState<LearnerKanjiListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Toàn bộ');
  const [strokeFilter, setStrokeFilter] = useState<number | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [levels, setLevels] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [radicals, setRadicals] = useState<LearnerRadicalMetadata[]>([]);
  const [selectedRadicals, setSelectedRadicals] = useState<string[]>([]);
  const [filterPage, setFilterPage] = useState<FilterPageNumber>(1);

  const getStrokesForPage = () => {
    switch (filterPage) {
      case 2:
        return [1, 2, 3, 4];
      case 3:
        return [5, 6, 7, 8, 9];
      case 4:
        return [10, 11, 12, 13, 14];
      case 5:
        return [15, 16, 17];
      default:
        return [];
    }
  };
  const currentStrokes = getStrokesForPage();

  const groupedRadicals = useMemo(() => {
    return radicals.reduce(
      (acc, rad) => {
        const s = rad.stroke || 0;
        if (!acc[s]) acc[s] = [];
        acc[s].push(rad);
        return acc;
      },
      {} as Record<number, LearnerRadicalMetadata[]>
    );
  }, [radicals]);

  const filteredList = kanjiList.filter((kanji) => {
    const search = searchTerm.toLowerCase().trim();
    const matchSearch =
      search === '' ||
      kanji.character?.toLowerCase().includes(search) ||
      kanji.meaning?.toLowerCase().includes(search) ||
      kanji.onyomi?.toLowerCase().includes(search) ||
      kanji.kunyomi?.toLowerCase().includes(search);
    const matchLevel = selectedLevel === 'Toàn bộ' || kanji.levelName === selectedLevel;
    const matchStroke = strokeFilter === 'all' || kanji.strokeCount === Number(strokeFilter);
    const matchAdvancedLevel =
      selectedLevels.length === 0 || (kanji.levelName && selectedLevels.includes(kanji.levelName));
    const matchTopic =
      selectedTopics.length === 0 || (kanji.topicName && selectedTopics.includes(kanji.topicName));
    const matchRadical =
      selectedRadicals.length === 0 ||
      (kanji.radical?.id && selectedRadicals.includes(kanji.radical.id));
    return matchSearch && matchLevel && matchStroke && matchAdvancedLevel && matchTopic && matchRadical;
  });

  const fetchKanjis = async () => {
    try {
      setLoading(true);
      const res = await learnerKanjiService.getAll();
      setKanjiList(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [topicData, levelData, radicalData] = await Promise.all([
        learnerKanjiService.getTopics(),
        learnerKanjiService.getLevels(),
        learnerKanjiService.getRadicals(),
      ]);
      setTopics(topicData || []);
      setLevels(levelData || []);
      setRadicals(radicalData || []);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu lọc:', error);
    }
  };

  useEffect(() => {
    fetchKanjis();
    fetchFilters();
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (showFilter) e.preventDefault();
    };
    if (showFilter) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchmove', handleWheel as EventListener, { passive: false });
    }
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleWheel as EventListener);
    };
  }, [showFilter]);

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'N5':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'N4':
        return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'N3':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'N2':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'N1':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  if (loading && kanjiList.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background-light">
        <LearnerHeader title="Kanji" />
        <div className="p-8 text-center text-[#886373] font-bold">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
      <LearnerHeader>
        <div className="flex items-center gap-4 w-full flex-wrap">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <h2 className="text-xl font-bold text-[#181114]">KANJI</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm kanji, nghĩa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>
        </div>
      </LearnerHeader>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-4 mb-8 no-scrollbar">
          <div className="flex flex-wrap items-start gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all border shadow-sm active:scale-95 ${
                  showFilter
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                Bộ lọc
              </button>

              {showFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  <div className="absolute top-full left-0 mt-3 w-[min(100vw-2rem,28rem)] max-h-[70vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.15)] border border-[#f4f0f2] p-8 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2 mb-6 border-b border-[#f4f0f2] pb-2 flex-wrap">
                      {[
                        { id: 1, label: 'Cơ bản & Chủ đề' },
                        { id: 2, label: 'Bộ 1–4' },
                        { id: 3, label: 'Bộ 5–9' },
                        { id: 4, label: 'Bộ 10–14' },
                        { id: 5, label: 'Bộ 15–17' },
                      ].map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => setFilterPage(page.id as FilterPageNumber)}
                          className={`pb-2 px-2 text-xs font-bold transition-all border-b-2 ${
                            filterPage === page.id
                              ? 'text-primary border-primary'
                              : 'text-gray-400 border-transparent'
                          }`}
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-6">
                      {filterPage === 1 ? (
                        <>
                          <div>
                            <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-primary" /> Trình độ
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {['N5', 'N4', 'N3', 'N2', 'N1'].map((lv) => (
                                <button
                                  key={lv}
                                  type="button"
                                  onClick={() =>
                                    setSelectedLevels((prev) =>
                                      prev.includes(lv) ? prev.filter((x) => x !== lv) : [...prev, lv]
                                    )
                                  }
                                  className={`px-4 py-2 rounded-xl text-[14px] font-bold border ${
                                    selectedLevels.includes(lv)
                                      ? 'bg-primary/10 text-primary border-primary/20'
                                      : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                  }`}
                                >
                                  {lv}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-[#f4f0f2] pt-6">
                            <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-amber-400" /> Chủ đề
                            </h4>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {topics.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedTopics((prev) =>
                                      prev.includes(t.name) ? prev.filter((x) => x !== t.name) : [...prev, t.name]
                                    )
                                  }
                                  className={`px-4 py-2 rounded-xl text-[14px] font-medium border ${
                                    selectedTopics.includes(t.name)
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                                      : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                  }`}
                                >
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-6 max-h-80 pr-2 custom-scrollbar overflow-y-auto">
                          {currentStrokes.map((stroke) => (
                            <div key={stroke} className="flex gap-4 mb-2">
                              <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[#fbf9fa] border border-[#f4f0f2] text-[15px] font-black text-[#886373]">
                                {stroke}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {groupedRadicals[stroke]?.length ? (
                                  groupedRadicals[stroke].map((rad) => (
                                    <button
                                      key={rad.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedRadicals((prev) =>
                                          prev.includes(rad.id) ? prev.filter((x) => x !== rad.id) : [...prev, rad.id]
                                        )
                                      }
                                      className={`px-4 py-2 rounded-xl text-[14px] border transition-all duration-200 ${
                                        selectedRadicals.includes(rad.id)
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
                                          : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                      }`}
                                    >
                                      <span className="font-japanese text-[20px]">{rad.character}</span>
                                    </button>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-gray-300 mt-2">—</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 pt-1 min-h-11">
              {selectedLevels.map((lv) => (
                <div
                  key={lv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full"
                >
                  <span className="text-[14px] font-bold text-primary">{lv}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLevels((prev) => prev.filter((x) => x !== lv))}
                    className="flex items-center text-primary hover:text-primary-dark"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {selectedTopics.map((topicName) => (
                <div
                  key={topicName}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full"
                >
                  <span className="text-[14px] font-bold text-amber-700">{topicName}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTopics((prev) => prev.filter((x) => x !== topicName))}
                    className="text-amber-700 hover:text-amber-900 flex"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {selectedRadicals.map((radId) => {
                const radInfo = radicals.find((r) => r.id === radId);
                if (!radInfo) return null;
                return (
                  <div
                    key={radId}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full"
                  >
                    <span className="font-japanese text-[18px] text-indigo-700 leading-none">
                      {radInfo.character}
                    </span>
                    <span className="text-[15px] font-bold text-indigo-500/80 border-l border-indigo-200 pl-1.5 ml-0.5">
                      {radInfo.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedRadicals((prev) => prev.filter((x) => x !== radId))}
                      className="text-indigo-400 hover:text-indigo-700 flex ml-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                );
              })}
              {(selectedLevels.length > 0 || selectedTopics.length > 0 || selectedRadicals.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevels([]);
                    setSelectedTopics([]);
                    setSelectedRadicals([]);
                  }}
                  className="text-[12px] font-black uppercase tracking-wider text-[#886373] hover:text-red-500 px-3 py-1.5 transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-[#fbf9fa] border border-[#f4f0f2] rounded-full px-4 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <span className="material-symbols-outlined text-[16px] text-[#886373] mr-2">draw</span>
                <input
                  type="number"
                  placeholder="Số nét"
                  value={strokeFilter === 'all' ? '' : strokeFilter}
                  onChange={(e) => setStrokeFilter(e.target.value ? parseInt(e.target.value, 10) : 'all')}
                  className="w-14 bg-transparent text-[15px] font-bold text-[#181114] outline-none no-spinner placeholder:text-[#886373]/50 placeholder:font-normal"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('Toàn bộ');
                  setStrokeFilter('all');
                }}
                className="size-9 flex items-center justify-center bg-white text-[#886373] border border-[#f4f0f2] rounded-full hover:text-red-500 hover:border-red-200 transition-all active:scale-90 shadow-sm"
                title="Xóa lọc nhanh"
              >
                <span className="material-symbols-outlined text-[18px]">filter_list_off</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredList.map((kanji) => (
            <div
              key={kanji.id}
              className="group relative bg-white rounded-4xl border border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 flex flex-col aspect-3/4.5 overflow-hidden"
            >
              <Link
                to={`/learner/studyresource/kanji/${kanji.id}`}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex translate-x-14 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 size-12 rounded-full bg-white shadow-xl border border-[#f4f0f2] items-center justify-center text-primary hover:border-primary no-underline"
              >
                <span className="material-symbols-outlined text-xl">visibility</span>
              </Link>

              <Link
                to={`/learner/studyresource/kanji/${kanji.id}`}
                className="p-6 flex-1 flex flex-col no-underline text-inherit"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[15px] font-bold rounded border ${getLevelStyle(kanji.levelName)}`}>
                    {kanji.levelName || 'N/A'}
                  </span>
                  <div className="text-[15px] text-[#886373] font-medium text-right mt-1">
                    Bộ thủ:
                    <span className="font-japanese text-primary ml-1" title={kanji.radical?.name || 'N/A'}>
                      {kanji.radical?.character || '？'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <span className="text-7xl font-japanese font-bold text-[#181114] group-hover:scale-105 transition-transform duration-500">
                    {kanji.character}
                  </span>
                  <div className="flex flex-col gap-2 w-full text-center mt-4">
                    <p className="text-[15px] font-japanese text-[#181114]">On: {kanji.onyomi || '—'}</p>
                    <p className="text-[15px] font-japanese text-[#181114]">Kun: {kanji.kunyomi || '—'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#f4f0f2] text-center">
                  <p className="text-[18px] font-bold text-[#181114]">{kanji.meaning || 'Chưa có nghĩa'}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyKanjiListPage;
