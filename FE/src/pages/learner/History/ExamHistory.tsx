import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerExamService } from '../../../services/Learner/examService';
import { ExamResultListItemDTO } from '../../../interfaces/Learner/Exam';

const StatCard = ({ icon, label, value, iconColorClass, bgColorClass }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm flex items-center gap-4">
    <div className={`size-12 rounded-full ${bgColorClass} flex items-center justify-center`}>
      <span className={`material-symbols-outlined ${iconColorClass}`}>{icon}</span>
    </div>
    <div>
      <p className="text-[10px] text-[#886373] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-[#181114] leading-tight">{value}</p>
    </div>
  </div>
);

const getExamTypeName = (examType: number) => {
  switch (examType) {
    case 0:
      return 'Đề thi thử JLPT';
    case 1:
      return 'Luyện kỹ năng';
    case 2:
      return 'Luyện bài học';
    default:
      return 'Exam';
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('vi-VN');
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${ss.toString().padStart(2, '0')} phút`;
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
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [results, sortBy]);

  const totalDone = results.length;

  const jlptResults = results.filter(r => r.examType === 0);
 const averageScore =
  jlptResults.length > 0
    ? Math.round(
        jlptResults.reduce(
          (sum, item) => sum + item.score,
          0
        ) / jlptResults.length
      )
    : '-';

  const totalSeconds = results.reduce(
    (sum, item) => sum + item.timeSpent,
    0
  );

  const totalHours = (totalSeconds / 3600).toFixed(1);


  const getResultPath = (item: ExamResultListItemDTO) => {
  if (item.examType === 0) {
    return `/learner/exams/jlpt-exams/result/${item.resultID}`;
  }
  return `/learner/quiz/result/${item.resultID}`;
  };

  return (
    <div className="flex flex-col h-full bg-background-light">
      <LearnerHeader>
        <div className="flex flex-col">
          <h2 className="text-[#181114] text-xl font-bold tracking-tight uppercase">
            Lịch sử kiểm tra
          </h2>
          <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
            <span>Học tập</span> /{' '}
            <span className="text-primary font-bold">
              Lịch sử bài làm
            </span>
          </nav>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#181114] text-3xl font-black tracking-tight uppercase">
                Kết quả học tập
              </h1>
              <p className="text-[#886373] text-lg font-medium">
                Theo dõi toàn bộ lịch sử làm bài của bạn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#f4f0f2] shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  filter_list
                </span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-[#bcaab2] leading-none tracking-wider">
                    Sắp xếp
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-[#181114] cursor-pointer p-0 pr-6 outline-none uppercase"
                  >
                    <option value="latest">Ngày gần nhất</option>
                    <option value="score">Điểm cao nhất</option>
                    <option value="time">Thời gian làm bài</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#f4f0f2] shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  school
                </span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-[#bcaab2] leading-none tracking-wider">
                    Loại bài
                  </span>
                  <select
                    value={examTypeFilter}
                    onChange={(e) => setExamTypeFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-[#181114] cursor-pointer p-0 pr-6 outline-none uppercase"
                  >
                    <option value="all">Tất cả</option>
                    <option value="0">Đề thi thử JLPT</option>
                    <option value="1">Luyện kỹ năng</option>
                    <option value="2">Luyện bài học</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon="quiz"
              label="Tổng bài đã làm"
              value={totalDone}
              iconColorClass="text-primary"
              bgColorClass="bg-primary/10"
            />
            <StatCard
              icon="trending_up"
              label="Điểm trung bình (JLPT)"
              value={averageScore}
              iconColorClass="text-emerald-600"
              bgColorClass="bg-emerald-50"
            />
            <StatCard
              icon="timer"
              label="Tổng thời gian"
              value={`${totalHours} giờ`}
              iconColorClass="text-amber-600"
              bgColorClass="bg-amber-50"
            />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-[#f4f0f2] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9fa] border-b border-[#f4f0f2]">
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">
                      Ngày thực hiện
                    </th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">
                      Tên bài kiểm tra
                    </th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">
                      Kết quả
                    </th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">
                      Thời gian
                    </th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em] text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-[#886373] font-bold">
                        Đang tải lịch sử làm bài...
                      </td>
                    </tr>
                  ) : sortedResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-[#886373] font-bold">
                        Chưa có lịch sử làm bài.
                      </td>
                    </tr>
                  ) : (
                    sortedResults.map((item) => {
                      const accuracy =
                        item.totalQuestions > 0
                          ? Math.round(
                              (item.correctAnswers /
                                item.totalQuestions) *
                                100
                            )
                          : 0;

                      return (
                        <tr
                          key={item.resultID}
                          className="hover:bg-[#fbf9fa] transition-colors border-b border-[#f4f0f2] last:border-0 group"
                        >
                          <td className="px-8 py-5">
                            <p className="text-sm font-bold text-[#181114]">
                              {formatDate(item.createdAt)}
                            </p>
                            <p className="text-[10px] text-[#886373] font-medium uppercase">
                              {formatTime(item.createdAt)}
                            </p>
                          </td>

                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                {getExamTypeName(item.examType)}
                              </span>
                              <p className="text-sm font-bold text-[#181114] group-hover:text-primary transition-colors">
                                {item.examTitle}
                              </p>
                            </div>
                          </td>

                         <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">

                              {/* Chỉ hiện điểm với JLPT */}
                              {item.examType === 0 && (
                                <>
                                  <p className="text-sm font-black text-[#181114]">
                                    {item.score.toFixed(2)} điểm
                                  </p>

                                  {item.isPassed !== null &&
                                    item.isPassed !== undefined && (
                                      <span
                                        className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-black ${
                                          item.isPassed
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-rose-50 text-rose-700'
                                        }`}
                                      >
                                        {item.isPassed ? 'Đạt' : 'Chưa đạt'}
                                      </span>
                                    )}
                                </>
                              )}

                              {/* Luôn hiện số câu đúng */}
                              <p className="text-xs font-bold text-[#886373]">
                                Đúng {item.correctAnswers}/{item.totalQuestions} câu · {accuracy}%
                              </p>

                            </div>
                          </td>

                          <td className="px-8 py-5">
                            <span className="text-xs font-bold text-[#886373] uppercase tracking-wider">
                              {formatDuration(item.timeSpent)}
                            </span>
                          </td>

                          <td className="px-8 py-5 text-right">
                            <button
                               onClick={() => navigate(getResultPath(item))
                              }
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group/btn"
                            >
                              Xem lại
                              <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">
                                arrow_forward
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-4 bg-[#fbf9fa] flex items-center justify-between border-t border-[#f4f0f2]">
              <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">
                Hiển thị {sortedResults.length} bài làm
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamHistory;