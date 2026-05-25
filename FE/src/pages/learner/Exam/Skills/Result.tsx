import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ExamReviewQuestionDTO,
  ExamReviewTreeItemDTO,
  SubmitExamResultDTO,
} from '../../../../interfaces/Learner/Exam';
import { LearnerExamService } from '../../../../services/Learner/examService';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { getSkillHubConfig } from './skillHubTheme';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

type ResultLocationState = {
  result?: SubmitExamResultDTO;
  examTitle?: string;
  courseId?: string;
};

const QuizResult: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { resultId, skillType } = useParams<{ resultId: string; skillType?: string }>();
  const locationState = (state ?? {}) as ResultLocationState;
  const [result, setResult] = useState<SubmitExamResultDTO | null>(locationState.result ?? null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const courseId = locationState.courseId;

  const theme = useMemo(() => getSkillHubConfig(skillType), [skillType]);

  const handleBack = () => {
    if (skillType) {
      navigate(`/learner/skill-learning/${skillType}/practice-list`);
      return;
    }
    if (locationState.courseId) {
      navigate(`/learner/courses/${locationState.courseId}`);
      return;
    }
    navigate('/learner/courses');
  };

  const handleFinish = () => {
    if (skillType) {
      navigate(`/learner/skill-learning/${skillType}/practice-list`);
    } else {
      navigate(courseId ? `/learner/courses/${courseId}` : '/learner/courses');
    }
  };

  useEffect(() => {
    let alive = true;
    if (result) return;
    if (!resultId) return;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await LearnerExamService.getExamResult(resultId);
        if (alive) setResult(data);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không tải được kết quả bài thi.';
        if (alive) setLoadError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [result, resultId]);

  const examTitle = useMemo(
    () => locationState.examTitle ?? result?.examTitle ?? 'Bài thi',
    [locationState.examTitle, result],
  );

  /* ─── Shared header block ─── */
  const PageHeader = ({ subtitle }: { subtitle: React.ReactNode }) => (
    <LearnerHeader>
      <div className="flex w-full items-center gap-4">
        <div className="flex flex-1 items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f4f0f2] text-[#886373] transition-colors hover:bg-[#f4f0f2] active:scale-90"
            aria-label="Quay lại"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex min-w-0 flex-col">
            <h2 className="text-xl font-bold uppercase text-[#181114]">Kết quả</h2>
            <nav className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#886373]">
              <span>{skillType ? theme.title : 'Bài kiểm tra'}</span>
              <span>/</span>
              {subtitle}
            </nav>
          </div>
        </div>
      </div>
    </LearnerHeader>
  );

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#f7f4f6] font-['Lexend']">
        <PageHeader subtitle={<span className={`font-bold ${theme.colorText}`}>Đang tải…</span>} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className={`size-12 animate-spin rounded-full border-4 border-[#e8e2e6] ${theme.spinnerTop}`} />
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.colorText}`}>Đang tải…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (loadError) {
    return (
      <div className="flex h-screen flex-col bg-[#f7f4f6] font-['Lexend']">
        <PageHeader subtitle={<span className="font-bold text-rose-500">Lỗi</span>} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e2e6] bg-white p-8 text-center shadow-sm">
            <span className="material-symbols-outlined mb-4 text-5xl text-rose-400">error</span>
            <h2 className="mb-3 text-xl font-black text-[#1a1118]">Không tải được kết quả</h2>
            <p className="mb-6 text-sm text-[#7a6a71]">{loadError}</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-11 items-center gap-2 rounded-full border-2 border-[#e8e2e6] px-6 font-black text-[#6b5a62] transition hover:bg-[#f4f0f2]"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => navigate('/learner/courses')}
                className={`h-11 rounded-full px-6 font-black text-white shadow-md transition ${theme.colorBg} ${theme.shadowGlow}`}
              >
                Về khóa học
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── No result ─── */
  if (!result) {
    return (
      <div className="flex h-screen flex-col bg-[#f7f4f6] font-['Lexend']">
        <PageHeader subtitle={<span className="font-bold text-[#886373]">—</span>} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e2e6] bg-white p-8 text-center shadow-sm">
            <span className="material-symbols-outlined mb-4 text-5xl text-[#c0b0b8]">quiz</span>
            <h2 className="mb-3 text-xl font-black text-[#1a1118]">Không có dữ liệu kết quả</h2>
            <p className="mb-6 text-sm text-[#7a6a71]">Vui lòng làm bài và nộp bài để xem trang kết quả.</p>
            <button
              type="button"
              onClick={() => navigate('/learner/courses')}
              className={`h-11 rounded-full px-6 font-black text-white shadow-md ${theme.colorBg} ${theme.shadowGlow}`}
            >
              Về danh sách khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Computed values ─── */
  const accuracy =
    result.totalQuestions > 0
      ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
      : 0;
  const wrongCount = result.totalQuestions - result.correctAnswers;
  const mm = Math.floor(result.timeSpent / 60);
  const ss = (result.timeSpent % 60).toString().padStart(2, '0');
  const durationLabel =
    result.examDuration === 0 ? 'Luyện tập tự do' : `${result.examDuration} phút`;

  const gradeLabel = accuracy >= 80 ? 'Xuất sắc' : accuracy >= 60 ? 'Đạt yêu cầu' : 'Cần cố gắng';
  const gradeIcon = accuracy >= 80 ? 'emoji_events' : accuracy >= 60 ? 'thumb_up' : 'sentiment_dissatisfied';
  const gradeClasses =
    accuracy >= 80
      ? { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' }
      : accuracy >= 60
        ? { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
        : { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };

  const titleTruncated = examTitle.length > 32 ? examTitle.slice(0, 32) + '…' : examTitle;

  type ReviewItem = {
    key: string;
    question: ExamReviewQuestionDTO | ExamReviewTreeItemDTO;
    parentContent?: string | null;
    groupLabel?: string;
  };

  const reviewItems: ReviewItem[] = [];
  result.sections.forEach((section, sectionIndex) => {
    if (section.type === 'Normal') {
      reviewItems.push({
        key: section.questionID ?? `section-${sectionIndex}`,
        question: section,
      });
      return;
    }

    section.subQuestions.forEach((subQ, subIndex) => {
      reviewItems.push({
        key: subQ.questionID,
        question: subQ,
        parentContent: section.content,
        groupLabel: `${sectionIndex + 1}-${subIndex + 1}`,
      });
    });
  });

  const renderAnswerOptions = (
    answers: ExamReviewQuestionDTO['answers'],
    compact = false,
  ) => (
    <div className="space-y-2">
      {answers.map((opt, optIdx) => {
        const letter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);
        const isCorrect = opt.isCorrect ?? false;
        const isWrongSelected = opt.isSelected && !isCorrect;

        return (
          <div
            key={opt.answerID}
            className={`flex items-center rounded-xl border-2 ${
              compact ? 'gap-3 px-4 py-2.5' : 'gap-4 px-5 py-3'
            } ${
              isCorrect
                ? 'border-emerald-400 bg-emerald-50'
                : isWrongSelected
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-[#e8e2e6] bg-[#faf9fa]'
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full border-2 font-black ${
                compact ? 'size-7 text-xs' : 'size-8 text-sm'
              } ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : isWrongSelected
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-[#d0c8cd] bg-white text-[#665868]'
              }`}
            >
              {letter}
            </span>
            <span
              className={`flex-1 ${compact ? 'text-sm' : 'text-[15px]'} font-medium leading-relaxed ${
                isCorrect
                  ? 'text-emerald-800'
                  : isWrongSelected
                    ? 'text-rose-800'
                    : 'text-[#665868]'
              }`}
            >
              {opt.answerText}
            </span>
            <div className="flex shrink-0 gap-1.5">
              {opt.isSelected && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                    isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {!compact && (
                    <span className="material-symbols-outlined text-xs">person</span>
                  )}
                  Bạn chọn
                </span>
              )}
              {isCorrect && !opt.isSelected && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  {!compact && (
                    <span className="material-symbols-outlined text-xs">check</span>
                  )}
                  {compact ? 'Đúng' : 'Đáp án đúng'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const getIsCorrect = (q: ExamReviewQuestionDTO | ExamReviewTreeItemDTO) =>
    q.isCorrect ?? false;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f4f6] font-['Lexend'] text-[#1a1118]">

      {/* ═══════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════ */}
      <LearnerHeader>
        <div className="flex w-full items-center gap-4">

          {/* Left: back + title/breadcrumb */}
          <div className="flex flex-1 items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f4f0f2] text-[#886373] transition-colors hover:bg-[#f4f0f2] active:scale-90"
              aria-label="Quay lại"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex min-w-0 flex-col">
              <h2 className="text-xl font-bold uppercase text-[#181114]">Kết quả</h2>
              <nav className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#886373]">
                <span>{skillType ? theme.title : 'Bài kiểm tra'}</span>
                <span>/</span>
                <span className={`font-bold ${theme.colorText}`} title={examTitle}>
                  {titleTruncated}
                </span>
              </nav>
            </div>
          </div>
        </div>
      </LearnerHeader>

      {/* Thin accent bar */}
      <div className={`h-1 w-full ${theme.colorBg}`} />

      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">

        {/* ═══════════════════════════════════════════
            SCORE HERO CARD
        ═══════════════════════════════════════════ */}
        <section className={`rounded-2xl border bg-white px-6 py-8 shadow-sm md:px-10 md:py-10 ${theme.borderColor}`}>

          <p className={`mb-1 text-[11px] font-black uppercase tracking-[0.2em] ${theme.colorText}`}>
            Kết quả bài thi
          </p>
          <h1 className="mb-6 text-2xl font-black tracking-tight text-[#1a1118] md:text-3xl">
            {examTitle}
          </h1>

          {/* Grade badge + big accuracy number */}
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2 ${gradeClasses.bg} ${gradeClasses.border}`}
            >
              <span className={`material-symbols-outlined text-xl ${gradeClasses.text}`}>
                {gradeIcon}
              </span>
              <span className={`font-black ${gradeClasses.text}`}>{gradeLabel}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black tabular-nums md:text-6xl ${theme.colorText}`}>
                {accuracy}
              </span>
              <span className="text-xl font-bold text-[#9a8890]">%</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`rounded-xl border p-4 ${theme.colorLight} ${theme.borderColor}`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Điểm số</p>
              <p className={`mt-1 text-2xl font-black tabular-nums ${theme.colorText}`}>
                {result.score.toFixed(1)}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#8d7b83]">điểm</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Câu đúng</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-emerald-600">
                {result.correctAnswers}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-emerald-600/70">
                / {result.totalQuestions} câu
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Câu sai</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-rose-600">{wrongCount}</p>
              <p className="mt-0.5 text-[11px] font-bold text-rose-600/70">câu</p>
            </div>
            <div className="rounded-xl border border-[#e8e2e6] bg-[#faf9fa] p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Thời gian</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#1a1118]">
                {mm}:{ss}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#8d7b83]">{durationLabel}</p>
            </div>
          </div>

          {/* Accuracy progress bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-[11px] font-bold text-[#9a8890]">
              <span>Tỉ lệ chính xác</span>
              <span>{accuracy}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#e8e2e6]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${theme.colorBg}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            QUESTION REVIEW
        ═══════════════════════════════════════════ */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-black text-[#1a1118]">Chi tiết đáp án</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${theme.colorLight} ${theme.colorText}`}>
              {reviewItems.length} câu
            </span>
          </div>

          <div className="space-y-4">
            {reviewItems.map(({ key, question: q, parentContent, groupLabel }, index) => {
              const isCorrect = getIsCorrect(q);

              return (
                <article
                  key={key}
                  className={`rounded-2xl border bg-white px-6 py-6 shadow-sm ${
                    isCorrect ? 'border-emerald-100' : 'border-rose-100'
                  }`}
                >
                  {parentContent && (
                    <div className="mb-4 rounded-xl border border-[#ede7eb] bg-[#faf9fa] px-4 py-3 text-sm leading-relaxed text-[#665868]">
                      {parentContent}
                    </div>
                  )}

                  <div className="mb-5 flex items-start gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${
                        isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <p className="text-[15px] font-semibold leading-relaxed text-[#1a1118]">
                        {groupLabel && (
                          <span className="mr-1.5 text-[#a08a94]">({groupLabel})</span>
                        )}
                        {q.content}
                      </p>
                      <span
                        className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isCorrect ? 'check_circle' : 'cancel'}
                        </span>
                        {isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    </div>
                  </div>

                  {q.answers.length > 0 && renderAnswerOptions(q.answers)}

                  {(q.subQuestions?.length ?? 0) > 0 && (
                    <div className="mt-6 space-y-5 border-t border-[#ede7eb] pt-6">
                      {q.subQuestions?.map((subQ, subIndex) => (
                        <div
                          key={subQ.questionID}
                          className={`rounded-xl border p-5 ${
                            subQ.isCorrect
                              ? 'border-emerald-100 bg-emerald-50/40'
                              : 'border-rose-100 bg-rose-50/40'
                          }`}
                        >
                          <div className="mb-4 flex items-start gap-3">
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
                                subQ.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            >
                              {subIndex + 1}
                            </span>
                            <p className="text-[14px] font-semibold leading-relaxed text-[#1a1118]">
                              <span className="mr-1.5 text-[#a08a94]">
                                ({index + 1}-{subIndex + 1})
                              </span>
                              {subQ.content}
                            </p>
                          </div>

                          {subQ.answers.length > 0 && renderAnswerOptions(subQ.answers, true)}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ─── Bottom actions ─── */}
        <div className="flex flex-wrap justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 items-center gap-2 rounded-full border-2 border-[#e8e2e6] bg-white px-6 font-black text-[#6b5a62] transition hover:bg-[#f4f0f2]"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className={`flex h-11 items-center gap-2 rounded-full px-6 font-black text-white shadow-lg transition active:scale-95 ${theme.colorBg} ${theme.shadowGlow}`}
          >
            <span className="material-symbols-outlined text-base">
              {skillType ? 'fitness_center' : 'school'}
            </span>
            {skillType ? 'Luyện tiếp' : 'Về khóa học'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizResult;
