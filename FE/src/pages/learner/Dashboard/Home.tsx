import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import SkillRadarChart from '../../../components/learner/dashboard/SkillRadarChart';
import dashboardService from '../../../services/Learner/progressService';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { DashboardProgressResponse, UserSkillMatrixResponse } from '../../../interfaces/Learner/Dashboard';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { SKILL_TYPE_LABELS } from '../../../constants/admin/questionOptions';

const SKILL_ROUTE_SLUG: Record<number, string> = {
  [SkillType.Vocabulary]: 'vocabulary',
  [SkillType.Grammar]: 'grammar',
  [SkillType.Kanji]: 'kanji',
  [SkillType.Reading]: 'reading',
  [SkillType.Listening]: 'listening',
};

const QUICK_ACTIONS = [
  {
    title: 'Khóa học',
    desc: 'Tiếp tục lộ trình bài học',
    icon: 'school',
    path: '/learner/courses',
    accent: 'bg-rose-50 text-rose-500 border-rose-100',
  },
  {
    title: 'Flashcard',
    desc: 'Ôn tập SRS thông minh',
    icon: 'style',
    path: '/learner/flashcards',
    accent: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    title: 'Luyện thi',
    desc: 'Thi thử & bài luyện tập',
    icon: 'quiz',
    path: '/learner/exams/jlpt-exams',
    accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    title: 'Gia sư AI',
    desc: 'Hỏi đáp & giải thích bài',
    icon: 'smart_toy',
    path: '/learner/ai-tutor',
    accent: 'bg-violet-50 text-violet-600 border-violet-100',
  },
];

const LearnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardProgressResponse | null>(null);
  const [skillMatrix, setSkillMatrix] = useState<UserSkillMatrixResponse | null>(null);
  const [flashcardStats, setFlashcardStats] = useState({ dueCount: 0, totalCards: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [progressRes, matrixRes, decks] = await Promise.all([
          dashboardService.getOverallProgress(),
          dashboardService.getSkillMatrix(),
          FlashcardService.getDecks(),
        ]);

        setData(progressRes.data);
        setSkillMatrix(matrixRes.data);

        const totalDue = decks.reduce((acc: number, deck: { dueCount?: number }) => acc + (deck.dueCount || 0), 0);
        const totalCards = decks.reduce((acc: number, deck: { totalCards?: number }) => acc + (deck.totalCards || 0), 0);
        setFlashcardStats({ dueCount: totalDue, totalCards });
      } catch (err) {
        console.error('Lỗi khi tải dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const weakestSkill = useMemo(() => {
    if (!skillMatrix?.skills?.length) return null;
    const sorted = [...skillMatrix.skills].sort((a, b) => a.proficiencyScore - b.proficiencyScore);
    const skill = sorted[0];
    return {
      ...skill,
      label: SKILL_TYPE_LABELS[skill.skillType as SkillType] ?? skill.skillName,
    };
  }, [skillMatrix]);

  const handleSkillNavigate = (skillType: number) => {
    const slug = SKILL_ROUTE_SLUG[skillType] ?? 'vocabulary';
    navigate(`/learner/skill-learning/${slug}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
        <div className="text-primary font-black animate-pulse">ĐANG TẢI DỮ LIỆU...</div>
      </div>
    );
  }

  const currentLevel = data?.currentLevelName ?? 'N5';

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader title="Tổng quan" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-8xl mx-auto px-6 py-8 lg:px-8 space-y-8">

          {/* Welcome banner — gọn, không lặp số liệu phía dưới */}
          <section className="relative overflow-hidden rounded-[2.5rem] border-2 border-[#f4f0f2] bg-linear-to-br from-white via-[#fdf8fa] to-[#fff5f9] px-6 py-6 lg:px-8 lg:py-7 shadow-sm">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              <div className="size-14 lg:size-16 rounded-2xl bg-white border border-[#f4f0f2] shadow-sm flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-3xl">waving_hand</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1.5">Tổng quan học tập</p>
                <h2 className="text-xl lg:text-2xl font-black text-[#181114] tracking-tight">Chào mừng trở lại!</h2>
                <p className="text-sm text-[#886373] mt-1.5 max-w-2xl leading-relaxed">
                  {(data?.totalPercent ?? 0) === 0 ? (
                    <>
                      Bạn đang theo lộ trình JLPT cấp{' '}
                      <span className="font-bold text-[#181114]">{currentLevel}</span>. Hãy bắt đầu với khóa học hoặc bài luyện tập để hệ thống ghi nhận tiến trình.
                    </>
                  ) : (
                    <>
                      Lộ trình JLPT cấp{' '}
                      <span className="font-bold text-[#181114]">{currentLevel}</span> — xem ma trận kỹ năng và tiến trình chi tiết ngay bên dưới.
                    </>
                  )}
                </p>
              </div>

              <div className="shrink-0 sm:text-right">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/90 border border-[#f4f0f2] px-4 py-3 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-xl">verified</span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#886373]">Cấp độ hiện tại</p>
                    <p className="text-lg font-black text-[#181114] leading-none mt-0.5">{currentLevel}</p>
                  </div>
                </span>
              </div>
            </div>
          </section>

          {/* Skill matrix + stats */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section className="xl:col-span-2 bg-white rounded-[2.5rem] border-2 border-[#f4f0f2] p-8 lg:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Ma trận kỹ năng</p>
                  <h2 className="text-2xl font-black text-[#181114] tracking-tight">Chỉ số thành thạo JLPT</h2>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-[#faf8f9] border border-[#f4f0f2] px-4 py-3 text-center min-w-[88px]">
                    <p className="text-xl font-black text-[#181114]">{Math.round(skillMatrix?.averageProficiency ?? 0)}</p>
                    <p className="text-[9px] font-black text-[#886373] uppercase tracking-wider">TB điểm</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-center min-w-[88px]">
                    <p className="text-xl font-black text-rose-600">{skillMatrix?.skillsNeedingReview ?? 0}</p>
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-wider">Cần ôn</p>
                  </div>
                </div>
              </div>

              <SkillRadarChart
                skills={skillMatrix?.skills ?? []}
                onSkillClick={handleSkillNavigate}
              />
            </section>

            <aside className="space-y-6">
              <div className="bg-white rounded-4xl border-2 border-[#f4f0f2] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#f4f0f2]">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#886373]">Tiến trình chi tiết</h3>
                    <p className="text-[11px] text-[#886373] font-medium mt-1">Tổng hợp lộ trình học</p>
                  </div>
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-2 text-center shrink-0">
                    <p className="text-xl font-black text-primary leading-none">{data?.totalPercent ?? 0}%</p>
                    <p className="text-[9px] font-black text-[#886373] uppercase tracking-wider mt-1">Tổng tiến độ</p>
                  </div>
                </div>

                {[
                  { label: 'Bài học', value: `${data?.courseProgress?.percentage ?? 0}%`, sub: `${data?.courseProgress?.completed ?? 0}/${data?.courseProgress?.total ?? 0} bài`, icon: 'menu_book', color: 'text-rose-500' },
                  { label: 'Luyện tập vượt qua', value: `${data?.examProgress?.passRate ?? 0}%`, sub: `${data?.examProgress?.passedExams ?? 0}/${data?.examProgress?.totalExams ?? 0} bài`, icon: 'check_circle', color: 'text-emerald-600' },
                  { label: 'Điểm TB', value: `${data?.examProgress?.averageScore ?? 0}/10`, sub: 'Từ các bài thi', icon: 'leaderboard', color: 'text-blue-600' },
                  { label: 'Flashcard', value: `${data?.skillProgress?.percentage ?? 0}%`, sub: `${flashcardStats.totalCards} thẻ`, icon: 'style', color: 'text-amber-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-[#faf8f9] flex items-center justify-center shrink-0">
                      <span className={`material-symbols-outlined text-xl ${item.color}`}>{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-[#181114]">{item.label}</span>
                        <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                      </div>
                      <p className="text-[11px] text-[#886373] font-medium">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#fff0f7] via-[#fde8f2] to-[#fce0ec] border-2 border-primary/20 p-5 shadow-sm">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="size-10 rounded-xl bg-white/80 border border-primary/15 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Gợi ý học tập</p>
                      <p className="text-sm text-[#534248] leading-relaxed">
                        {weakestSkill && weakestSkill.proficiencyScore > 0 ? (
                          <>
                            Kỹ năng <span className="font-bold text-[#181114]">{weakestSkill.label}</span> đang ở{' '}
                            <span className="font-black text-primary">{weakestSkill.proficiencyScore}%</span>.
                            {weakestSkill.needsReview ? ' Nên ôn lại sớm để tăng độ tự tin.' : ' Hãy luyện thêm để cân bằng các kỹ năng.'}
                          </>
                        ) : (
                          'Làm bài luyện tập hoặc thi thử để hệ thống ghi nhận chỉ số kỹ năng của bạn.'
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => weakestSkill && handleSkillNavigate(weakestSkill.skillType)}
                    className="shrink-0 w-full sm:w-auto rounded-xl bg-primary hover:brightness-105 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20 transition-all"
                  >
                    {weakestSkill ? 'Luyện kỹ năng yếu' : 'Bắt đầu luyện tập'}
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Quick actions */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#886373] mb-1">Truy cập nhanh</p>
                <h2 className="text-xl font-black text-[#181114]">Tiếp tục hành trình học</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group text-left bg-white rounded-[1.75rem] border-2 border-[#f4f0f2] p-6 hover:shadow-lg hover:border-primary/20 transition-all active:scale-[0.98]"
                >
                  <div className={`size-12 rounded-2xl border flex items-center justify-center mb-4 ${action.accent}`}>
                    <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                  </div>
                  <h3 className="font-black text-[#181114] mb-1">{action.title}</h3>
                  <p className="text-xs text-[#886373] font-medium leading-relaxed">{action.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Mở
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LearnerDashboard;
