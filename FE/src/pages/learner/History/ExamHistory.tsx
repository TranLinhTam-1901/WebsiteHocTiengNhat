import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerExamService } from '../../../services/Learner/examService';
import { ExamResultListItemDTO } from '../../../interfaces/Learner/Exam';

const EXAM_TYPE_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: '0', label: 'JLPT' },
  { value: '1', label: 'Kỹ năng' },
  { value: '2', label: 'Bài học' },
] as const;

const SORT_OPTIONS = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'score', label: 'Điểm cao' },
  { value: 'time', label: 'Thời gian' },
] as const;

type FilterPillsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

function FilterPills<T extends string>({ options, value, onChange }: FilterPillsProps<T>) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-0.5 bg-[#fbf9fa] rounded-lg border border-[#f4f0f2]">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-[#886373] hover:text-[#534248]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const getExamTypeConfig = (examType: number) => {
  switch (examType) {
    case 0:
      return {
        name: 'JLPT Mock Test',
        badgeClass: 'bg-primary/10 text-primary',
      };
    case 1:
      return {
        name: 'Skill Practice',
        badgeClass: 'bg-indigo-50 text-indigo-600',
      };
    case 2:
      return {
        name: 'Lesson Practice',
        badgeClass: 'bg-amber-50 text-amber-600',
      };
    default:
      return {
        name: 'Exam',
        badgeClass: 'bg-[#fbf9fa] text-[#886373]',
      };
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  if (mm === 0) return `${ss}s`;
  if (ss === 0) return `${mm} phút`;
  return `${mm}p ${ss}s`;
};

const ExamHistory = () => {
  const navigate = useNavigate();

  const [results, setResults] = useState<ExamResultListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const params =
          examTypeFilter === 'all'
            ? undefined
            : { examType: Number(examTypeFilter) };
        const data = await LearnerExamService.getMyExamResults(params);
        setResults(data);
      } catch (error) {
        console.error('Không tải được lịch sử làm bài:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [examTypeFilter]);

  const sortedResults = useMemo(() => {
    const copied = [...results];

    if (sortBy === 'score') {
      return copied.sort((a, b) => b.score - a.score);
    }
    if (sortBy === 'time') {
      return copied.sort((a, b) => b.timeSpent - a.timeSpent);
    }
    return copied.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [results, sortBy]);

  const totalDone = results.length;
  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, item) => sum + item.score, 0) / results.length
        )
      : 0;
  const totalHours = (results.reduce((s, i) => s + i.timeSpent, 0) / 3600).toFixed(1);
  const passedCount = results.filter((item) => item.isPassed === true).length;

  const getResultPath = (item: ExamResultListItemDTO) => {
    if (item.examType === 0) {
      return `/learner/exams/jlpt-exams/result/${item.resultID}`;
    }
    return `/learner/quiz/result/${item.resultID}`;
  };

  const stats = [
    { icon: 'quiz', label: 'Bài đã làm', value: totalDone, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: 'trending_up', label: 'Điểm TB', value: averageScore, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: 'timer', label: 'Tổng giờ', value: `${totalHours}h`, color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: 'verified', label: 'Đạt yêu cầu', value: passedCount, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa]">
      <LearnerHeader>
        <div className="flex flex-col">
          <h2 className="text-[#181114] text-xl font-bold tracking-tight uppercase">
            Lịch sử kiểm tra
          </h2>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-6 md:py-8 space-y-6">
          {/* Page title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#181114] tracking-tight">
              Kết quả học tập
            </h1>
            <p className="text-[#886373] text-sm md:text-base font-medium mt-1">
              Xem lại toàn bộ bài kiểm tra bạn đã hoàn thành.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-[#f4f0f2] p-4 md:p-5 flex items-center gap-3 md:gap-4"
              >
                <div className={`size-10 md:size-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-black text-[#886373] uppercase tracking-wider truncate">
                    {s.label}
                  </p>
                  <p className="text-xl md:text-2xl font-black text-[#181114] leading-tight">
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl border border-[#f4f0f2] overflow-hidden">
            <div className="px-4 md:px-5 py-3 border-b border-[#f4f0f2] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center gap-2 shrink-0">
                <h2 className="text-sm font-black text-[#181114] uppercase tracking-wider">
                  Danh sách bài làm
                </h2>
                {!loading && (
                  <span className="text-[10px] font-bold text-[#886373]">
                    ({sortedResults.length})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <FilterPills
                  options={EXAM_TYPE_FILTERS}
                  value={examTypeFilter}
                  onChange={setExamTypeFilter}
                />
                <FilterPills
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-bold text-[#886373] uppercase tracking-wider">
                  Đang tải...
                </p>
              </div>
            ) : sortedResults.length === 0 ? (
              <div className="py-16 px-6 flex flex-col items-center gap-4 text-center">
                <div className="size-16 rounded-2xl bg-[#fbf9fa] flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-[#bcaab2]">
                    inventory_2
                  </span>
                </div>
                <div>
                  <p className="text-base font-black text-[#181114]">Chưa có bài làm nào</p>
                  <p className="text-sm text-[#886373] mt-1">
                    Hoàn thành bài kiểm tra để xem kết quả tại đây.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/learner/exams')}
                  className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Làm bài ngay
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table header */}
                <div className="hidden md:grid md:grid-cols-[140px_1fr_120px_100px_100px] gap-4 px-6 py-3 bg-[#fbf9fa] border-b border-[#f4f0f2]">
                  {['Ngày', 'Bài kiểm tra', 'Kết quả', 'Thời gian', ''].map((col) => (
                    <span
                      key={col || 'action'}
                      className="text-[10px] font-black text-[#886373] uppercase tracking-wider"
                    >
                      {col}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-[#f4f0f2]">
                  {sortedResults.map((item) => {
                    const typeConfig = getExamTypeConfig(item.examType);
                    const accuracy =
                      item.totalQuestions > 0
                        ? Math.round(
                            (item.correctAnswers / item.totalQuestions) * 100
                          )
                        : 0;

                    return (
                      <div
                        key={item.resultID}
                        className="group px-5 md:px-6 py-4 md:py-5 hover:bg-[#fbf9fa]/60 transition-colors"
                      >
                        {/* Mobile layout */}
                        <div className="md:hidden space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${typeConfig.badgeClass}`}
                                >
                                  {typeConfig.name}
                                </span>
                                {item.isPassed != null && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                      item.isPassed
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-rose-50 text-rose-700'
                                    }`}
                                  >
                                    {item.isPassed ? 'Đạt' : 'Chưa đạt'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-black text-[#181114] leading-snug">
                                {item.examTitle}
                              </p>
                            </div>
                            <p className="text-lg font-black text-primary shrink-0">
                              {item.score.toFixed(1)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#886373]">
                            <span>
                              {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                            </span>
                            <span>
                              {item.correctAnswers}/{item.totalQuestions} câu · {accuracy}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#886373] flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {formatDuration(item.timeSpent)}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate(getResultPath(item))}
                              className="text-xs font-bold text-primary flex items-center gap-0.5"
                            >
                              Xem lại
                              <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                          </div>
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden md:grid md:grid-cols-[140px_1fr_120px_100px_100px] md:items-center gap-4">
                          <div>
                            <p className="text-sm font-bold text-[#181114]">
                              {formatDate(item.createdAt)}
                            </p>
                            <p className="text-[11px] text-[#886373] font-medium mt-0.5">
                              {formatTime(item.createdAt)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${typeConfig.badgeClass}`}
                              >
                                {typeConfig.name}
                              </span>
                              {item.isPassed != null && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                                    item.isPassed
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {item.isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-[#181114] truncate group-hover:text-primary transition-colors">
                              {item.examTitle}
                            </p>
                          </div>

                          <div>
                            <p className="text-base font-black text-[#181114]">
                              {item.score.toFixed(1)}
                              <span className="text-[10px] font-bold text-[#886373] ml-0.5">đ</span>
                            </p>
                            <p className="text-[10px] font-bold text-[#886373] mt-0.5">
                              {item.correctAnswers}/{item.totalQuestions} · {accuracy}%
                            </p>
                          </div>

                          <p className="text-xs font-bold text-[#886373]">
                            {formatDuration(item.timeSpent)}
                          </p>

                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => navigate(getResultPath(item))}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors"
                            >
                              Xem lại
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamHistory;
