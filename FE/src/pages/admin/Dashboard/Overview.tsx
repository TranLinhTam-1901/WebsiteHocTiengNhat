import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../../components/layout/admin/AdminHeader';
import dashboardService from '../../../services/Admin/dashboardService';
import { AdminDashboardOverview } from '../../../interfaces/Admin/Dashboard';

type ActivityMetric = 'sessions' | 'lessons';

const LEVEL_COLORS: Record<string, string> = {
  N5: 'bg-emerald-500',
  N4: 'bg-sky-500',
  N3: 'bg-amber-500',
  N2: 'bg-violet-500',
  N1: 'bg-rose-500',
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n);
}

function formatPercent(n: number, decimals = 1): string {
  const formatted =
    Number.isInteger(n)
      ? n.toString()
      : n.toFixed(decimals).replace('.', ',');

  return `${formatted}%`;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Chưa có hoạt động';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function levelBadgeClass(level: string): string {
  const key = level?.toUpperCase() ?? '';
  switch (key) {
    case 'N1': return 'bg-rose-50 text-rose-600';
    case 'N2': return 'bg-violet-50 text-violet-600';
    case 'N3': return 'bg-amber-50 text-amber-600';
    case 'N4': return 'bg-sky-50 text-sky-600';
    case 'N5': return 'bg-emerald-50 text-emerald-600';
    default: return 'bg-[#f4f0f2] text-[#886373]';
  }
}

const DashboardIndex: React.FC = () => {
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityMetric, setActivityMetric] = useState<ActivityMetric>('sessions');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await dashboardService.getOverview();
      setData(overview);
    } catch {
      setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartMax = useMemo(() => {
    if (!data?.activityLast7Days?.length) return 1;
    const values = data.activityLast7Days.map((d) =>
      activityMetric === 'sessions' ? d.examSessions : d.lessonAccesses,
    );
    return Math.max(1, ...values);
  }, [data, activityMetric]);

  const levelMax = useMemo(() => {
    if (!data?.learnersByLevel?.length) return 1;
    return Math.max(1, ...data.learnersByLevel.map((l) => l.learnerCount));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Tổng quan hệ thống" />
        <div className="p-8 space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-[#f4f0f2]" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-2xl border border-[#f4f0f2]" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Tổng quan hệ thống" />
        <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[320px]">
          <span className="material-symbols-outlined text-4xl text-rose-400">error_outline</span>
          <p className="text-[#886373] text-sm">{error}</p>
          <button
            type="button"
            onClick={load}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;
  const trend = summary.activityTrendPercent;
  const trendLabel =
    trend == null ? null : trend >= 0 ? `+${formatPercent(trend, 1)}` : formatPercent(trend, 1);

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Tổng quan hệ thống" />

      <div className="p-6 lg:p-8 space-y-8">
        <p className="text-xs text-[#886373] -mt-4 mb-2">
          Cập nhật lúc {new Date(data.generatedAt).toLocaleString('vi-VN')}
        </p>
        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            icon="group"
            label="Tổng học viên"
            value={formatNumber(summary.totalLearners)}
            sub={`${summary.lockedLearners} tài khoản khóa`}
            color="blue"
            trend={trendLabel}
            trendUp={trend != null && trend >= 0}
          />
          <StatCard
            icon="sensors"
            label="Đang online"
            value={formatNumber(summary.onlineLearners)}
            sub="Theo phiên SignalR"
            color="purple"
          />
          <StatCard
            icon="verified"
            label="Tỷ lệ đỗ trung bình"
            value={formatPercent(summary.averagePassRatePercent)}
            sub="Trên mọi lượt làm bài thi"
            color="primary"
            isPrimary
          />
          <StatCard
            icon="trending_up"
            label="Tiến độ bài học TB"
            value={formatPercent(summary.averageLessonProgressPercent)}
            // sub={`${summary.activeLearnersLast7Days}`}
            color="amber"
          />
        </div>

        {/* Chart */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#181114]">Hoạt động 7 ngày qua</h3>
              <p className="text-sm text-[#886373]">Phiên thi và lượt truy cập bài học</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActivityMetric('sessions')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  activityMetric === 'sessions'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-[#f4f0f2] text-[#886373] hover:bg-primary/10'
                }`}
              >
                Phiên thi
              </button>
              <button
                type="button"
                onClick={() => setActivityMetric('lessons')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  activityMetric === 'lessons'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-[#f4f0f2] text-[#886373] hover:bg-primary/10'
                }`}
              >
                Truy cập bài
              </button>
            </div>
          </div>

          <div className="relative h-64 w-full rounded-xl border border-[#f4f0f2] bg-gradient-to-b from-primary/5 to-white px-5 pt-6 pb-8 overflow-visible">          {(() => {
            const values = data.activityLast7Days.map((day) =>
              activityMetric === 'sessions' ? day.examSessions : day.lessonAccesses
            );

            const max = Math.max(1, ...values);

            const points = values.map((value, index) => {
              const x =
                data.activityLast7Days.length === 1
                  ? 50
                  : (index / (data.activityLast7Days.length - 1)) * 100;

              const y = 88 - (value / max) * 70;

              return { x, y, value };
            });

            const path = points
              .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            const areaPath = `${path} L 100 92 L 0 92 Z`;

    return (
      <>
        <div className="absolute inset-x-10 top-10 bottom-12 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-[#f4f0f2]" />
          ))}
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute left-10 right-10 top-10 bottom-12 w-[calc(100%-40px)] h-[calc(100%-56px)]"
        >
          <path d={areaPath} fill="currentColor" className="text-primary/10" />
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-primary"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="absolute left-10 right-10 top-10 bottom-12">
        {points.map((p, index) => (
            <div
              key={data.activityLast7Days[index].date}
              className="absolute top-0 bottom-0 -translate-x-1/2 group"
              style={{ left: `${p.x}%` }}
            >
              <div className="h-full border-l border-dashed border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${p.y}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-primary shadow-md group-hover:scale-125 transition-transform" />

                <div className={`absolute -top-24 opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
                    index === 0
                      ? 'left-0'
                      : index === points.length - 1
                      ? 'right-0'
                      : 'left-1/2 -translate-x-1/2'
                  }`}
                >                  <div className="rounded-xl bg-[#181114] text-white px-3 py-2 shadow-lg whitespace-nowrap">
                    <p className="text-[11px] font-bold">
                      {new Date(data.activityLast7Days[index].date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-[10px] text-white/80 mt-1">
                      Phiên thi: {data.activityLast7Days[index].examSessions}
                    </p>
                    <p className="text-[10px] text-white/80">
                      Truy cập bài: {data.activityLast7Days[index].lessonAccesses}
                    </p>
                    <p className="text-[10px] font-bold mt-1">
                      Đang xem: {p.value}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-primary text-center mt-1">
                  {p.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute left-5 right-5 bottom-2 flex justify-between">
          {data.activityLast7Days.map((day) => (
            <span
              key={day.date}
              className="text-[10px] font-bold text-[#886373] uppercase"
            >
              {day.label}
            </span>
          ))}
        </div>
      </>
    );
  })()}
</div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top wrong questions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#f4f0f2] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#f4f0f2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#181114]">Câu sai nhiều nhất</h3>
                <p className="text-xs text-[#886373] mt-0.5">Từ kết quả thi (tối thiểu 3 lượt làm)</p>
              </div>
              <Link
                to="/admin/resource/question"
                className="text-primary text-sm font-bold hover:underline shrink-0"
              >
                Ngân hàng câu hỏi
              </Link>
            </div>
            {data.topWrongQuestions.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#886373] italic">
                Chưa đủ dữ liệu kết quả thi để thống kê.
              </div>
            ) : (
              <div className="divide-y divide-[#f4f0f2]">
                {data.topWrongQuestions.map((q) => (
                  <div
                    key={q.questionId}
                    className="p-4 flex items-center gap-4 hover:bg-primary/5 transition-colors"
                  >
                    <div className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${levelBadgeClass(q.levelName)}`}>
                      {q.levelName}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1 text-[#181114]">{q.content}</p>
                      <p className="text-[10px] text-[#886373]">
                        {formatPercent(q.wrongRatePercent)} tỷ lệ sai • {q.skillTypeLabel} • {q.attemptCount} lượt
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[#886373] text-lg shrink-0">quiz</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: level + content */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#f4f0f2] p-6 shadow-sm">
              <h3 className="font-bold text-[#181114] mb-1">Phân bổ học viên</h3>
              <p className="text-xs text-[#886373] mb-5">Theo cấp JLPT đã chọn</p>
              {data.learnersByLevel.length === 0 ? (
                <p className="text-xs text-[#886373] italic">Chưa có học viên.</p>
              ) : (
                <div className="space-y-4">
                  {data.learnersByLevel.map((lvl) => {
                    const pct = Math.round((lvl.learnerCount / levelMax) * 100);
                    const barColor = LEVEL_COLORS[lvl.levelName.toUpperCase()] ?? 'bg-primary';
                    return (
                      <div key={lvl.levelId ?? lvl.levelName}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-[#181114]">{lvl.levelName}</span>
                          <span className="text-[#886373]">{lvl.learnerCount}</span>
                        </div>
                        <div className="h-2 bg-[#f4f0f2] rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#f4f0f2] p-6 shadow-sm">
              <h3 className="font-bold text-[#181114] mb-5">Kho nội dung</h3>
              <div className="grid grid-cols-2 gap-3">
                <ContentStat icon="quiz" label="Câu hỏi" value={data.contentStats.questions} />
                <ContentStat icon="assignment" label="Đề đã publish" value={data.contentStats.publishedExams} />
                <ContentStat icon="menu_book" label="Bài học" value={data.contentStats.lessons} />
                <ContentStat icon="translate" label="Từ vựng" value={data.contentStats.vocabularies} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent learners */}
        <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#f4f0f2] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#181114]">Học viên hoạt động gần đây</h3>
              <p className="text-xs text-[#886373] mt-0.5">Theo lần học / làm bài gần nhất</p>
            </div>
            <Link
              to="/admin/learners"
              className="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline"
            >
              Quản lý học viên
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#886373] bg-[#fbf9fa]">
                  <th className="px-6 py-3 font-bold">Học viên</th>
                  <th className="px-6 py-3 font-bold">JLPT</th>
                  <th className="px-6 py-3 font-bold">Bài hoàn thành</th>
                  <th className="px-6 py-3 font-bold">Hoạt động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f0f2]">
                {data.recentActiveLearners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-[#886373] italic">
                      Chưa có hoạt động ghi nhận.
                    </td>
                  </tr>
                ) : (
                  data.recentActiveLearners.map((learner) => (
                    <tr key={learner.userId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#181114]">{learner.fullName}</p>
                        <p className="text-xs text-[#886373] truncate max-w-[220px]">{learner.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${levelBadgeClass(learner.levelName)}`}>
                          {learner.levelName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#181114]">{learner.completedLessons}</td>
                      <td className="px-6 py-4 text-[#886373] text-xs">
                        {formatRelativeTime(learner.lastActivityAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: 'blue' | 'purple' | 'amber' | 'primary';
  isPrimary?: boolean;
  trend?: string | null;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sub,
  color,
  isPrimary,
  trend,
  trendUp,
}) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-500',
    purple: 'bg-purple-50 text-purple-500',
    amber: 'bg-amber-50 text-amber-500',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend != null && (
          <span
            className={`text-xs font-bold flex items-center gap-0.5 ${
              trendUp ? 'text-emerald-600' : 'text-rose-500'
            }`}
          >
            {trend}
            <span className="material-symbols-outlined text-xs">
              trending_{trendUp ? 'up' : 'down'}
            </span>
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-[#886373]">{label}</p>
      <h3 className={`text-2xl font-black mt-1 ${isPrimary ? 'text-primary' : 'text-[#181114]'}`}>{value}</h3>
      {sub && <p className="text-[10px] text-[#886373] mt-2">{sub}</p>}
    </div>
  );
};

const ContentStat = ({ icon, label, value }: { icon: string; label: string; value: number }) => (
  <div className="rounded-xl border border-[#f4f0f2] bg-[#fbf9fa] p-3">
    <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
    <p className="text-[10px] font-bold text-[#886373] uppercase mt-2 tracking-wide">{label}</p>
    <p className="text-lg font-black text-[#181114]">{formatNumber(value)}</p>
  </div>
);

export default DashboardIndex;
