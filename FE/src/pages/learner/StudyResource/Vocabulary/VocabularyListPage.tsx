import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { learnerVocabService } from '../../../../services/Learner/learnerVocabService';
import { LearnerVocabListItem } from '../../../../interfaces/Learner/StudyResource';

const StudyVocabularyListPage: React.FC = () => {
  const [vocabList, setVocabList] = useState<LearnerVocabListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [filterPage, setFilterPage] = useState<1 | 2>(1);
  const [wordTypes, setWordTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedWordTypes, setSelectedWordTypes] = useState<string[]>([]);
  type SortDirection = 'asc' | 'desc' | null;
  const [isCommonOnly, setIsCommonOnly] = useState<boolean | null>(null);
  const [sortPriority, setSortPriority] = useState<SortDirection>(null);

  const filteredVocabs = useMemo(() => {
    const result = vocabList.filter((item) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.word?.toLowerCase().includes(s) ||
        item.reading?.toLowerCase().includes(s) ||
        item.meaning?.toLowerCase().includes(s);
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(item.levelName);
      const matchesTopic =
        selectedTopics.length === 0 ||
        item.topics?.some((topicName: string) => selectedTopics.includes(topicName));
      const matchesWordType =
        selectedWordTypes.length === 0 ||
        item.wordTypes?.some((typeName: string) => selectedWordTypes.includes(typeName));
      const matchesCommon = isCommonOnly === null || item.isCommon === isCommonOnly;
      return matchesSearch && matchesLevel && matchesWordType && matchesTopic && matchesCommon;
    });
    if (!sortPriority) return result;
    return [...result].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return sortPriority === 'asc' ? priorityA - priorityB : priorityB - priorityA;
    });
  }, [vocabList, searchTerm, selectedLevels, selectedWordTypes, selectedTopics, isCommonOnly, sortPriority]);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [vocabs, allTopics, allWordTypes] = await Promise.all([
          learnerVocabService.getAll(),
          learnerVocabService.getTopics(),
          learnerVocabService.getWordTypes(),
        ]);
        setVocabList(vocabs);
        setTopics(allTopics);
        setWordTypes(allWordTypes);
      } catch (error) {
        console.error('Lỗi khởi tạo dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
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

  const getLevelStyle = (level?: string) => {
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

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
      <LearnerHeader>
        <div className="flex items-center gap-4 w-full flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-[200px]">
            <h2 className="text-xl font-bold text-[#181114]">TỪ VỰNG</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm từ vựng..."
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
                    <div className="flex gap-4 mb-6 border-b border-[#f4f0f2] pb-2">
                      <button
                        type="button"
                        onClick={() => setFilterPage(1)}
                        className={`pb-2 px-2 text-sm font-bold transition-all ${
                          filterPage === 1 ? 'text-primary border-b-2 border-primary' : 'text-gray-400'
                        }`}
                      >
                        Cơ bản & Chủ đề
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterPage(2)}
                        className={`pb-2 px-2 text-sm font-bold transition-all ${
                          filterPage === 2 ? 'text-primary border-b-2 border-primary' : 'text-gray-400'
                        }`}
                      >
                        Nhóm & Các loại
                      </button>
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
                        <div className="flex flex-col gap-6">
                          <div>
                            <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-indigo-500" /> Loại từ
                            </h4>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {wordTypes.map((type) => (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedWordTypes((prev) =>
                                      prev.includes(type.name)
                                        ? prev.filter((x) => x !== type.name)
                                        : [...prev, type.name]
                                    )
                                  }
                                  className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-all ${
                                    selectedWordTypes.includes(type.name)
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                                      : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20'
                                  }`}
                                >
                                  {type.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-[#f4f0f2] pt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-rose-500" /> Thông dụng
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { value: true as const, label: 'Từ thông dụng' },
                                    { value: false as const, label: 'Từ hiếm gặp' },
                                  ].map((opt) => (
                                    <button
                                      key={opt.label}
                                      type="button"
                                      onClick={() =>
                                        setIsCommonOnly(isCommonOnly === opt.value ? null : opt.value)
                                      }
                                      className={`px-5 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
                                        isCommonOnly === opt.value
                                          ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                                          : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20 text-gray-500'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-[#886373] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-amber-500" /> Thứ tự ưu tiên
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { id: 'asc' as const, label: 'Tăng dần', icon: '↑' },
                                    { id: 'desc' as const, label: 'Giảm dần', icon: '↓' },
                                  ].map((opt) => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() =>
                                        setSortPriority((prev) => (prev === opt.id ? null : opt.id))
                                      }
                                      className={`px-5 py-2.5 rounded-xl text-[13px] font-medium border transition-all flex items-center gap-2 ${
                                        sortPriority === opt.id
                                          ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                                          : 'bg-[#fbf9fa] border-transparent hover:border-[#886373]/20 text-gray-500'
                                      }`}
                                    >
                                      <span className="opacity-50">{opt.icon}</span>
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
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
              {selectedWordTypes.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full"
                >
                  <span className="text-[14px] font-bold text-indigo-700">{name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedWordTypes((prev) => prev.filter((x) => x !== name))}
                    className="flex items-center text-indigo-700 hover:text-indigo-900"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {selectedTopics.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full"
                >
                  <span className="text-[14px] font-bold text-amber-700">{name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTopics((prev) => prev.filter((x) => x !== name))}
                    className="text-amber-700 hover:text-amber-900 flex"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {(selectedLevels.length > 0 ||
                selectedTopics.length > 0 ||
                selectedWordTypes.length > 0 ||
                isCommonOnly !== null ||
                sortPriority !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevels([]);
                    setSelectedTopics([]);
                    setSelectedWordTypes([]);
                    setIsCommonOnly(null);
                    setSortPriority(null);
                  }}
                  className="text-[12px] font-black uppercase tracking-wider text-[#886373] hover:text-red-500 px-3 py-1.5 transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#886373] font-bold">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredVocabs.map((item) => (
              <div
                key={item.vocabID}
                className="group relative bg-white rounded-[2.5rem] border border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col aspect-[3/4.2] overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-6 flex justify-center z-50">
                  <Link
                    to={`/learner/studyresource/vocabulary/${item.vocabID}`}
                    className="size-12 rounded-full bg-white shadow-2xl border border-[#f4f0f2] flex items-center justify-center text-primary hover:border-primary transition-all active:scale-90 no-underline translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-500"
                  >
                    <span className="material-symbols-outlined text-2xl">visibility</span>
                  </Link>
                </div>

                <Link
                  to={`/learner/studyresource/vocabulary/${item.vocabID}`}
                  className="p-7 flex-1 flex flex-col items-center text-center no-underline text-inherit"
                >
                  <div className="w-full flex justify-between items-start mb-6">
                    <span
                      className={`px-2 py-0.5 text-[15px] font-bold rounded border ${getLevelStyle(item.levelName)}`}
                    >
                      {item.levelName || '—'}
                    </span>
                    <div className="flex justify-end max-w-[70%] items-center">
                      <div className="flex items-center gap-2">
                        {item.topics?.[0] && (
                          <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 text-primary text-[15px] font-bold rounded-lg truncate max-w-32 whitespace-nowrap italic">
                            {item.topics[0]}
                          </span>
                        )}
                        {item.topics && item.topics.length > 1 && (
                          <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            <span className="text-[15px] font-black">+{item.topics.length - 1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-5">
                    <span className="text-primary text-[18px] font-japanese mb-1 font-bold italic tracking-wide">
                      {item.reading}
                    </span>
                    <span className="font-japanese text-[65px] font-black text-[#181114] tracking-tighter">
                      {item.word}
                    </span>
                  </div>

                  <div className="w-12 h-1.5 bg-primary/10 rounded-full mb-6" />

                  <div className="flex-1 flex items-start justify-center px-2">
                    <p className="text-[20px] font-bold text-[#5a434d] leading-relaxed line-clamp-3 italic">
                      &quot;{item.meaning}&quot;
                    </p>
                  </div>
                  <div className="h-10" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyVocabularyListPage;
