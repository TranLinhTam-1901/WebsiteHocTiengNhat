import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { LearnerExamService } from '../../../../services/Learner/examService';
import { AnswerOptionDTO, ExamDisplayDTO, ExamTreeItemDTO, QuestionDisplayDTO, UserAnswerSelectionDTO } from '../../../../interfaces/Learner/Exam';
import { toast } from 'react-hot-toast';
import { getSkillHubConfig, SkillHubConfig } from './skillHubTheme';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

type RealQuestionItem = {
  question: QuestionDisplayDTO;
  parentQuestion: ExamTreeItemDTO;
};

const mapTreeSubToQuestion = (sq: ExamTreeItemDTO['subQuestions'][number]): QuestionDisplayDTO => ({
  questionID: sq.questionID,
  content: sq.content,
  imageURL: sq.imageURL,
  options: sq.options ?? [],
  subQuestions: [],
  questionType: 0 as QuestionDisplayDTO['questionType'],
  questionFormat: 0 as QuestionDisplayDTO['questionFormat'],
  totalSubQuestions: 0,
});

const mapNormalTreeToQuestion = (item: ExamTreeItemDTO): QuestionDisplayDTO => ({
  questionID: item.questionID!,
  content: item.content ?? '',
  imageURL: item.imageURL,
  options: item.options ?? [],
  subQuestions: [],
  questionType: 0 as QuestionDisplayDTO['questionType'],
  questionFormat: 0 as QuestionDisplayDTO['questionFormat'],
  totalSubQuestions: 0,
});

/** Panel trái / mobile: tên bài nghe, audio, hình câu hỏi, script */
const ListeningMediaPanel: React.FC<{
  parentQuestion: ExamTreeItemDTO;
  imageURL?: string | null;
  theme: SkillHubConfig;
  compact?: boolean;
}> = ({ parentQuestion, imageURL, theme, compact = false }) => {
  const audioSrc = parentQuestion.audioUrl ? resolveMediaUrl(parentQuestion.audioUrl) : undefined;
  const imageSrc = imageURL ? resolveMediaUrl(imageURL) : undefined;
  const title = parentQuestion.content?.trim();
  const hasScript = Boolean(parentQuestion.script?.trim());

  if (parentQuestion.type === 'Normal' && !imageSrc) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8d0d5] bg-[#faf9fa] px-6 py-10 text-center text-sm text-[#9a8890]">
        Câu hỏi này không có bài nghe đi kèm.
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {title && (
        <div
          className={`rounded-2xl border bg-linear-to-br from-white to-[#faf8f9] shadow-sm ${theme.borderColor} ${
            compact ? 'px-4 py-3' : 'px-5 py-4'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${theme.colorBg} ${
                compact ? 'size-9' : 'size-11'
              }`}
            >
              <span className={`material-symbols-outlined ${compact ? 'text-lg' : 'text-xl'}`}>headphones</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.colorText}`}>
                Tên bài nghe
              </p>
              <h3 className={`mt-0.5 font-bold leading-snug text-[#1a1118] ${compact ? 'text-base' : 'text-lg'}`}>
                {title}
              </h3>
            </div>
          </div>
        </div>
      )}

      {parentQuestion.type === 'Listening' && audioSrc && (
        <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.borderColor}`}>
          <div className={`flex items-center gap-3 border-b border-[#f0eaed] ${theme.colorLight} ${compact ? 'px-4 py-3' : 'px-5 py-3.5'}`}>
            <div className={`flex shrink-0 items-center justify-center rounded-full bg-white/80 ${theme.colorText}`}>
              <span className={`material-symbols-outlined ${compact ? 'p-1.5 text-lg' : 'p-2 text-xl'}`}>
                graphic_eq
              </span>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.colorText}`}>
                Nghe file âm thanh
              </p>
              <p className="text-[11px] font-medium text-[#8a7880]">Nghe kỹ trước khi chọn đáp án</p>
            </div>
          </div>
          <div className={`bg-white ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
            <audio
              controls
              controlsList="nodownload"
              className="h-10 w-full accent-violet-500"
              src={audioSrc}
            />
          </div>
        </div>
      )}

      {imageSrc && (
        <div className="overflow-hidden rounded-2xl border border-[#e8e2e6] bg-white shadow-sm">
          <div className={`flex items-center gap-2 border-b border-[#f4f0f2] bg-[#faf9fa] ${compact ? 'px-4 py-2.5' : 'px-5 py-3'}`}>
            <span className={`material-symbols-outlined text-[#886373] ${compact ? 'text-base' : 'text-lg'}`}>
              image
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#886373]">
              Hình minh họa câu hỏi
            </span>
          </div>
          <div className={`flex items-center justify-center bg-[#fcfbfc] ${compact ? 'p-3' : 'p-5'}`}>
            <img
              src={imageSrc}
              alt="Minh họa câu hỏi"
              className={`w-full rounded-xl border border-[#f0eaed] bg-white object-contain shadow-inner ${
                compact ? 'max-h-52' : 'max-h-80'
              }`}
            />
          </div>
        </div>
      )}

      {hasScript && (
        <details className="group overflow-hidden rounded-2xl border border-[#e8e2e6] bg-white shadow-sm">
          <summary
            className={`flex cursor-pointer list-none items-center gap-2 font-bold [&::-webkit-details-marker]:hidden ${
              theme.colorText
            } ${compact ? 'px-4 py-3 text-sm' : 'px-5 py-3.5 text-sm'}`}
          >
            <span className="material-symbols-outlined text-base">description</span>
            Xem script / lời thoại
            <span className="material-symbols-outlined ml-auto text-[#9a8890] transition-transform group-open:rotate-180">
              expand_more
            </span>
          </summary>
          <div className={`border-t border-[#f4f0f2] ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
            <p className="whitespace-pre-wrap text-sm leading-[1.95] text-[#3d2f36]">{parentQuestion.script}</p>
          </div>
        </details>
      )}
    </div>
  );
};

const ExamDetailPage = () => {
  const { id, skillType } = useParams<{ id: string; skillType?: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [exam, setExam] = useState<ExamDisplayDTO | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerSelectionDTO>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(10);

  const theme = useMemo(() => getSkillHubConfig(skillType), [skillType]);
  const isListeningMode = skillType === 'listening';
  const passageSplitLayout = skillType === 'reading' || isListeningMode;

  const realQuestions = useMemo<RealQuestionItem[]>(() => {
    if (!exam?.sections?.length) return [];

    const result: RealQuestionItem[] = [];

    exam.sections.forEach((item) => {
      if (item.type === 'Normal' && item.questionID) {
        result.push({
          question: mapNormalTreeToQuestion(item),
          parentQuestion: item,
        });
      }

      if (item.type === 'Reading' || item.type === 'Listening') {
        item.subQuestions.forEach((sq) => {
          result.push({
            question: mapTreeSubToQuestion(sq),
            parentQuestion: item,
          });
        });
      }
    });

    return result;
  }, [exam]);

  const useListeningFlow = isListeningMode && realQuestions.length > 0;
  const useSectionFlow = realQuestions.length > 0;

  const navQuestions = useMemo(
    () => realQuestions.map((item) => item.question),
    [realQuestions],
  );

  const questionStartRef = useRef<Record<string, number>>({});
  const questionPanelRef = useRef<HTMLDivElement>(null);
  const timeUpHandledRef = useRef(false);

  useEffect(() => {
    if (id) {
      LearnerExamService.getExamQuestions(id).then((data) => {
        setExam(data);
        setTimeLeft(data.duration * 60);
      });
    }
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!timeUpHandledRef.current && exam) {
        timeUpHandledRef.current = true;
        setShowTimeUpModal(true);
        setAutoCountdown(10);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  useEffect(() => {
    if (!showTimeUpModal) return;
    if (autoCountdown <= 0) {
      handleForceSubmit();
      return;
    }
    const t = setTimeout(() => setAutoCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTimeUpModal, autoCountdown]);

  useEffect(() => {
    questionPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  useEffect(() => {
    if (!exam) return;

    const item = realQuestions[currentIndex];
    if (!item) return;

    const qid = item.question.questionID;
    if (!questionStartRef.current[qid]) {
      questionStartRef.current[qid] = Date.now();
    }

    if (!useSectionFlow) return;

    const allInCurrent = [
      item.question.questionID,
      ...item.question.subQuestions.map((sq) => sq.questionID),
    ];
    const now = Date.now();
    allInCurrent.forEach((id) => {
      if (!questionStartRef.current[id]) {
        questionStartRef.current[id] = now;
      }
    });
  }, [exam, currentIndex, useSectionFlow, realQuestions]);

  const getElapsedSeconds = (questionID: string) => {
    const start = questionStartRef.current[questionID] ?? Date.now();
    return Math.max(1, Math.floor((Date.now() - start) / 1000));
  };

  const handleSelectAnswer = (questionID: string, answerID: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionID]: {
        questionID,
        selectedAnswerID: answerID,
        responseTime:
          prev[questionID]?.responseTime && prev[questionID].responseTime > 0
            ? prev[questionID].responseTime
            : getElapsedSeconds(questionID),
      },
    }));
  };

  const isListeningQuestionAnswered = (questionID: string) =>
    !!userAnswers[questionID]?.selectedAnswerID;

  const totalQuestionCount = useMemo(() => {
    if (!exam) return 0;
    return useSectionFlow ? realQuestions.length : 0;
  }, [exam, useSectionFlow, realQuestions.length]);

  const answeredCount = useMemo(() => {
    if (!exam) return 0;
    if (useSectionFlow) {
      return realQuestions.filter((item) =>
        isListeningQuestionAnswered(item.question.questionID),
      ).length;
    }
    return 0;
  }, [exam, userAnswers, useSectionFlow, realQuestions]);

  /** Nộp bài buộc khi hết giờ — không kiểm tra đủ câu, gửi tất cả đáp án đã chọn */
  const handleForceSubmit = async () => {
    if (!exam || !id || isSubmitting) return;
    setShowTimeUpModal(false);

    const normalizedAnswers = Object.values(userAnswers)
      .filter((a) => !!a.selectedAnswerID || !!a.textAnswer)
      .map((a) => ({
        ...a,
        responseTime: a.responseTime > 0 ? a.responseTime : getElapsedSeconds(a.questionID),
      }));

    const request = {
      examID: id,
      totalTimeSpent: exam.duration * 60,
      answers: normalizedAnswers,
    };

    try {
      setIsSubmitting(true);
      const result = await LearnerExamService.submitExam(id, request);
      const resultPath = skillType
        ? `/learner/skill-learning/${skillType}/result/${result.resultID}`
        : `/learner/quiz/result/${result.resultID}`;

      navigate(resultPath, {
        state: { result, examTitle: exam.title, courseId: state?.courseId },
        replace: true,
      });
    } catch {
      toast.error('Nộp bài thất bại! Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!exam || !id || isSubmitting) return;

    const totalQuestions = totalQuestionCount;
    const isFullyAnswered = answeredCount === totalQuestions;

    if (!isFullyAnswered) {
      const remaining = totalQuestions - answeredCount;
      toast.error(`Bạn còn ${remaining} câu chưa hoàn thành. Vui lòng làm hết bài trước khi nộp!`);
      return;
    }

    const normalizedAnswers = Object.values(userAnswers)
      .filter((a) => !!a.selectedAnswerID || !!a.textAnswer)
      .map((a) => ({
        ...a,
        responseTime: a.responseTime > 0 ? a.responseTime : getElapsedSeconds(a.questionID),
      }));

    if (normalizedAnswers.length < totalQuestions) {
      toast.error('Hệ thống phát hiện dữ liệu chưa đồng bộ. Vui lòng kiểm tra lại các đáp án.');
      return;
    }

    const request = {
      examID: id,
      totalTimeSpent: exam.duration * 60 - timeLeft,
      answers: normalizedAnswers,
    };

    try {
      setIsSubmitting(true);
      const result = await LearnerExamService.submitExam(id, request);
      const resultPath = skillType
        ? `/learner/skill-learning/${skillType}/result/${result.resultID}`
        : `/learner/quiz/result/${result.resultID}`;

      navigate(resultPath, {
        state: { result, examTitle: exam.title, courseId: state?.courseId },
        replace: true,
      });
    } catch {
      alert('Nộp bài thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToList = () => {
    if (skillType) navigate(`/learner/skill-learning/${skillType}/practice-list`);
    else navigate(-1);
  };

  /** MCQ single-column list — professional exam style */
  const renderMCQOptions = (
    options: AnswerOptionDTO[],
    questionID: string,
    selectedAnswerId?: string,
  ) => (
    <div className="space-y-2.5">
      {options.map((opt, idx) => {
        const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
        const selected = selectedAnswerId === opt.answerID;
        return (
          <label
            key={opt.answerID}
            className={`group flex cursor-pointer items-center gap-4 rounded-xl border-2 px-5 py-3.5 transition-all duration-150 ${
              selected
                ? `${theme.examOptionSelected}`
                : `border-[#e8e2e6] bg-white hover:border-[#d5cfd3] hover:bg-[#faf9fa] ${theme.examOptionHover}`
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name={questionID}
              checked={selected}
              onChange={() => handleSelectAnswer(questionID, opt.answerID)}
            />
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-all ${
                selected
                  ? `${theme.colorBg} border-transparent text-white shadow-sm`
                  : 'border-[#d0c8cd] bg-white text-[#665868] group-hover:border-[#b8b0b6]'
              }`}
            >
              {letter}
            </span>
            <span
              className={`flex-1 text-[15px] font-medium leading-relaxed wrap-break-word ${
                selected ? 'text-[#1a1118]' : 'text-[#3d2f36]'
              }`}
            >
              {opt.answerText}
            </span>
            {selected && (
              <span className={`material-symbols-outlined shrink-0 text-xl ${theme.colorText}`}>
                check_circle
              </span>
            )}
          </label>
        );
      })}
    </div>
  );

  /* ─── Loading state ─── */
  if (!exam) {
    return (
      <div className="flex h-screen flex-col bg-[#f7f4f6] font-['Lexend']">
        <LearnerHeader>
          <div className="flex w-full items-center gap-4">
            <div className="flex flex-1 items-center gap-4">
              <button
                type="button"
                onClick={backToList}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f4f0f2] text-[#886373] transition-colors hover:bg-[#f4f0f2] active:scale-90"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold uppercase text-[#181114]">Làm bài thi</h2>
                <nav className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#886373]">
                  <span>{skillType ? theme.title : 'Bài kiểm tra'}</span>
                  <span>/</span>
                  <span className={`font-bold ${theme.colorText}`}>Đang tải…</span>
                </nav>
              </div>
            </div>
          </div>
        </LearnerHeader>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className={`size-12 animate-spin rounded-full border-4 border-[#e8e2e6] ${theme.spinnerTop}`} />
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.colorText}`}>Đang tải…</p>
          </div>
        </div>
      </div>
    );
  }

  const currentListeningItem = useSectionFlow ? realQuestions[currentIndex] : null;
  const parentQuestion = currentListeningItem?.parentQuestion ?? null;
  const currentQuestion = currentListeningItem?.question ?? null;
  const readingPassageContent =
    parentQuestion?.type === 'Reading'
      ? parentQuestion.content
      : currentQuestion?.readingContent;

  if (!currentQuestion) {
    return (
      <div className="flex h-screen flex-col bg-[#f7f4f6] font-['Lexend']">
        <LearnerHeader>
          <div className="flex w-full items-center gap-4">
            <button type="button" onClick={backToList} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f4f0f2] text-[#886373]">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-xl font-bold uppercase text-[#181114]">Không có câu hỏi</h2>
          </div>
        </LearnerHeader>
        <div className="flex flex-1 items-center justify-center text-[#886373]">Đề thi chưa có câu hỏi phù hợp.</div>
      </div>
    );
  }

  const unansweredCount = totalQuestionCount - answeredCount;
  const progressPercent = totalQuestionCount > 0
    ? Math.round((answeredCount / totalQuestionCount) * 100)
    : 0;
  const mm = Math.floor(Math.max(0, timeLeft) / 60);
  const ss = Math.max(0, timeLeft % 60).toString().padStart(2, '0');
  const timerUrgent = timeLeft > 0 && timeLeft <= 300;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f4f6] font-['Lexend'] text-[#1a1118]">

      {/* ═══════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════ */}
      <LearnerHeader>
        <div className="flex w-full items-center gap-249">

          {/* Left: back + title/breadcrumb */}
          <div className="flex flex-1 items-center gap-4">
            <button
              type="button"
              onClick={backToList}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f4f0f2] text-[#886373] transition-colors hover:bg-[#f4f0f2] active:scale-90"
              aria-label="Quay lại"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex min-w-0 flex-col">
              <h2 className="text-xl font-bold uppercase text-[#181114]">Làm bài thi</h2>
              <nav className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#886373]">
                <span>{skillType ? theme.title : 'Bài kiểm tra'}</span>
                <span>/</span>
                <span className={`font-bold ${theme.colorText}`} title={exam.title}>
                  {exam.title.length > 30 ? exam.title.slice(0, 30) + '…' : exam.title}
                </span>
              </nav>
            </div>
          </div>

          {/* Right: timer + submit */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 ${
                timerUrgent ? 'border-red-200 bg-red-50' : `${theme.borderColor} ${theme.colorLight}`
              }`}
            >
              <span
                className={`material-symbols-outlined text-base ${
                  timerUrgent ? 'text-red-500' : theme.colorText
                }`}
              >
                timer
              </span>
              <span
                className={`text-base font-black tabular-nums ${
                  timerUrgent ? 'animate-pulse text-red-600' : 'text-[#181114]'
                }`}
              >
                {mm}:{ss}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`hidden items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 active:scale-95 sm:flex ${theme.colorBg} ${theme.shadowGlow}`}
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {isSubmitting ? 'Đang nộp…' : 'Nộp bài'}
            </button>
          </div>
        </div>
      </LearnerHeader>

      {/* ── Global progress bar ── */}
      <div className="h-1 w-full bg-[#e8e2e6]">
        <div
          className={`h-full transition-all duration-500 ${theme.colorBg}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ═══════════════════════════════════════════
          BODY
      ═══════════════════════════════════════════ */}
      <div className="flex min-h-0 flex-1">

        {/* ── Passage panel (Reading / Listening only, desktop) ── */}
        {passageSplitLayout && (
          <aside className="hidden w-[44%] shrink-0 overflow-y-auto border-r border-[#e8e2e6] bg-linear-to-b from-[#faf9fa] to-white lg:block">
            <div className="px-6 py-7 lg:px-7">
              <div
                className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${theme.colorLight} ${theme.colorText} ${theme.borderColor}`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isListeningMode ? 'headphones' : 'article'}
                </span>
                {isListeningMode ? 'Phần nghe hiểu' : 'Đoạn văn'}
              </div>

              {useListeningFlow && parentQuestion ? (
                <ListeningMediaPanel
                  parentQuestion={parentQuestion}
                  imageURL={currentQuestion.imageURL}
                  theme={theme}
                />
              ) : (
                <>
                  {currentQuestion.audioURL && (
                    <div className={`mb-5 flex items-center gap-3 rounded-xl border p-4 ${theme.colorLight} ${theme.borderColor}`}>
                      <span className={`material-symbols-outlined text-2xl ${theme.colorText}`}>play_circle</span>
                      <div className="flex-1">
                        <p className={`text-xs font-black uppercase ${theme.colorText}`}>Tệp âm thanh</p>
                        <audio controls className="mt-1.5 w-full" src={resolveMediaUrl(currentQuestion.audioURL)} />
                      </div>
                    </div>
                  )}

                  {readingPassageContent ? (
                    <article className="whitespace-pre-wrap rounded-xl border border-[#e8e2e6] bg-[#faf9fa] px-6 py-6 text-[16px] leading-[2.1] text-[#2e2230]">
                      {readingPassageContent}
                    </article>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#d8d0d5] bg-[#faf9fa] px-6 py-16 text-center text-sm text-[#9a8890]">
                      Câu độc lập — không có đoạn văn đi kèm.
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}

        {/* ── Question panel ── */}
        <section
          ref={questionPanelRef}
          className={`min-h-0 flex-1 overflow-y-auto ${passageSplitLayout ? '' : ''}`}
        >
          <div
            className={`mx-auto px-5 py-6 md:px-8 md:py-8 ${
              passageSplitLayout ? 'max-w-none lg:max-w-2xl' : 'max-w-2xl'
            }`}
          >

            {/* Mobile: passage accordion */}
            {passageSplitLayout && (
              useListeningFlow && parentQuestion
                ? (parentQuestion.content || parentQuestion.audioUrl || parentQuestion.script || currentQuestion.imageURL)
                : (readingPassageContent || currentQuestion.audioURL)
            ) && (
              <div className="mb-5 lg:hidden">
                <details className="overflow-hidden rounded-2xl border border-[#e8e2e6] bg-white shadow-sm">
                  <summary
                    className={`flex cursor-pointer select-none items-center gap-2 px-4 py-3.5 text-sm font-bold ${theme.colorText}`}
                  >
                    <span className={`flex size-8 items-center justify-center rounded-lg text-white ${theme.colorBg}`}>
                      <span className="material-symbols-outlined text-base">
                        {isListeningMode ? 'headphones' : 'article'}
                      </span>
                    </span>
                    <span className="flex-1 text-left">
                      {isListeningMode ? 'Bài nghe & minh họa' : 'Xem đoạn văn'}
                    </span>
                    <span className="material-symbols-outlined text-base text-[#9a8890]">expand_more</span>
                  </summary>
                  <div className="border-t border-[#e8e2e6] bg-[#faf9fa] px-4 pb-4 pt-4">
                    {useListeningFlow && parentQuestion ? (
                      <ListeningMediaPanel
                        parentQuestion={parentQuestion}
                        imageURL={currentQuestion.imageURL}
                        theme={theme}
                        compact
                      />
                    ) : (
                      <>
                        {currentQuestion.audioURL && (
                          <audio controls className="mb-3 w-full" src={resolveMediaUrl(currentQuestion.audioURL)} />
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-[1.9] text-[#3d2f36]">
                          {readingPassageContent}
                        </p>
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Mobile: question nav pills */}
            <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none lg:hidden">
              {navQuestions.map((q: QuestionDisplayDTO, i: number) => {
                const answered = isListeningQuestionAnswered(q.questionID);
                return (
                <button
                  key={q.questionID}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black tabular-nums transition ${
                    i === currentIndex
                      ? theme.examNavActive
                      : answered
                        ? `${theme.colorBg} text-white opacity-90`
                        : 'border border-[#e0d8dc] bg-white text-[#7a6a72]'
                  }`}
                >
                  {i + 1}
                </button>
              );})}
            </div>

            {/* ── Question number badge ── */}
            <div className="mb-5 flex items-center gap-3">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-md ${theme.colorBg}`}
              >
                {currentIndex + 1}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9a8890]">
                  Câu {currentIndex + 1} / {totalQuestionCount}
                </p>
                <p className="text-[11px] font-medium text-[#b09aa4]">Chọn một đáp án đúng</p>
              </div>
            </div>

            {/* ── Main question card ── */}
            <div className={`rounded-2xl border bg-white px-6 py-7 shadow-sm md:px-8 md:py-8 ${theme.borderColor}`}>

              {/* Question text */}
              <p className="mb-7 text-lg font-semibold leading-[1.75] wrap-break-word text-[#1a1118] md:text-xl">
                {currentQuestion.content}
              </p>

              {/* Image — non-listening skills only (listening uses ListeningMediaPanel) */}
              {!useListeningFlow && currentQuestion.imageURL && (
                <img
                  src={resolveMediaUrl(currentQuestion.imageURL)}
                  alt="Hình minh họa câu hỏi"
                  className="mb-6 max-h-60 w-full rounded-xl border border-[#e8e2e6] object-contain"
                />
              )}

              {/* Direct options */}
              {currentQuestion.options?.length > 0 && (
                renderMCQOptions(
                  currentQuestion.options,
                  currentQuestion.questionID,
                  userAnswers[currentQuestion.questionID]?.selectedAnswerID ?? undefined,
                )
              )}

              {/* Sub-questions (reading / grouped questions — not used in listening flow) */}
              {!useListeningFlow && currentQuestion.subQuestions?.length > 0 && (
                <div className="mt-9 space-y-9 border-t border-[#ede7eb] pt-9">
                  {currentQuestion.subQuestions.map((subQ: QuestionDisplayDTO, subIndex: number) => (
                    <div key={subQ.questionID}>
                      {/* Sub-question header */}
                      <div className="mb-5 flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm ${theme.colorBg}`}
                        >
                          {subIndex + 1}
                        </span>
                        <p className="text-[15px] font-semibold leading-relaxed text-[#1a1118]">
                          <span className="mr-1.5 text-[#a08a94]">
                            ({currentIndex + 1}-{subIndex + 1})
                          </span>
                          {subQ.content}
                        </p>
                      </div>

                      {subQ.imageURL && (
                        <img
                          src={resolveMediaUrl(subQ.imageURL)}
                          alt="Hình câu phụ"
                          className="mb-4 max-h-48 w-full rounded-xl border border-[#e8e2e6] object-contain"
                        />
                      )}

                      {subQ.options?.length > 0 &&
                        renderMCQOptions(
                          subQ.options,
                          subQ.questionID,
                          userAnswers[subQ.questionID]?.selectedAnswerID ?? undefined,
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Prev / Next navigation ── */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="flex h-12 items-center gap-1.5 rounded-xl border-2 border-[#e0d8dc] bg-white px-5 font-black text-[#5c4f54] transition disabled:opacity-30 enabled:hover:bg-[#faf9fa]"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                Câu trước
              </button>

              <div className="flex-1" />

              {currentIndex < totalQuestionCount - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className={`flex h-12 items-center gap-1.5 rounded-xl px-5 font-black text-white shadow-md transition hover:brightness-105 ${theme.colorBg}`}
                >
                  Câu tiếp
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex h-12 items-center gap-2 rounded-xl px-6 font-black text-white shadow-md transition disabled:opacity-50 hover:brightness-105 ${theme.colorBg}`}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {isSubmitting ? 'Đang nộp…' : 'Nộp bài'}
                </button>
              )}
            </div>

            {/* Mobile-only submit */}
            <div className="mt-4 sm:hidden">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full rounded-xl py-3.5 font-black text-white shadow-md transition disabled:opacity-50 ${theme.colorBg} ${theme.shadowGlow}`}
              >
                {isSubmitting ? 'Đang nộp…' : 'Nộp bài'}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ANSWER SHEET SIDEBAR (desktop)
        ═══════════════════════════════════════════ */}
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-l border-[#e8e2e6] bg-white lg:flex">

          {/* Sidebar header */}
          <div className="border-b border-[#ede7eb] px-5 py-4">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${theme.colorText}`}>fact_check</span>
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7d6b74]">
                Phiếu trả lời
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-5 p-5">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-xl p-3.5 text-center ${theme.colorLight}`}>
                <p className={`text-2xl font-black tabular-nums ${theme.colorText}`}>{answeredCount}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-[#8d7b83]">Đã làm</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3.5 text-center">
                <p className="text-2xl font-black tabular-nums text-amber-600">{unansweredCount}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-[#8d7b83]">Còn lại</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="mb-1.5 flex justify-between text-[10px] font-bold text-[#9a8890]">
                <span>Hoàn thành</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#ede7eb]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${theme.colorBg}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question grid */}
            <div>
              <p className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-[#9a8890]">
                Danh sách câu
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {navQuestions.map((q: QuestionDisplayDTO, i: number) => {
                  const answered = isListeningQuestionAnswered(q.questionID);
                  return (
                  <button
                    key={q.questionID}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    title={`Câu ${i + 1}`}
                    className={`aspect-square rounded-lg text-xs font-black tabular-nums transition ${
                      i === currentIndex
                        ? theme.examNavActive
                        : answered
                          ? `${theme.colorBg} text-white shadow-sm`
                          : 'border border-[#dfd7dc] bg-[#faf9fa] text-[#6b5a63] hover:bg-[#f4f0f2]'
                    }`}
                  >
                    {i + 1}
                  </button>
                );})}
              </div>
            </div>

            {/* Legend */}
            <div className="rounded-xl border border-[#ede7eb] p-3.5 text-xs text-[#7d6b74]">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className={`size-5 shrink-0 rounded-md ${theme.colorBg}`} />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`size-5 shrink-0 rounded-md border-2 bg-white ${theme.examNavActive.includes('border') ? '' : 'border-gray-400'}`} />
                  <span>Đang xem</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="size-5 shrink-0 rounded-md border border-[#dfd7dc] bg-[#faf9fa]" />
                  <span>Chưa trả lời</span>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`mt-auto w-full rounded-xl py-3.5 text-sm font-black text-white shadow-md transition disabled:opacity-50 hover:brightness-105 ${theme.colorBg} ${theme.shadowGlow}`}
            >
              {isSubmitting ? 'Đang nộp…' : 'Nộp bài'}
            </button>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════
          TIME-UP MODAL
      ═══════════════════════════════════════════ */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <div className="relative w-full max-w-md animate-[fadeInScale_0.2s_ease-out] rounded-2xl border border-[#e8e2e6] bg-white shadow-2xl">

            {/* Top accent strip */}
            <div className="h-1.5 w-full rounded-t-2xl bg-rose-500" />

            <div className="px-8 py-8 text-center">
              {/* Icon */}
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-rose-50">
                <span className="material-symbols-outlined text-4xl text-rose-500">alarm_off</span>
              </div>

              {/* Title */}
              <h2 className="mb-2 text-2xl font-black text-[#1a1118]">Hết giờ!</h2>
              <p className="text-sm font-medium text-[#7a6a71]">
                Thời gian làm bài đã kết thúc.
                <br />
                Bài thi sẽ được tự động nộp.
              </p>

              {/* Stat row */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-2xl font-black tabular-nums text-emerald-600">{answeredCount}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                    Câu đã trả lời
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 px-4 py-3">
                  <p className="text-2xl font-black tabular-nums text-rose-500">
                    {exam ? totalQuestionCount - answeredCount : 0}
                  </p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-rose-700">
                    Câu bỏ trống
                  </p>
                </div>
              </div>

              {/* Auto-countdown */}
              <p className="mt-5 text-xs font-bold text-[#9a8890]">
                Tự động nộp sau{' '}
                <span className="tabular-nums text-rose-500">{autoCountdown}</span> giây…
              </p>

              {/* Countdown ring */}
              <div className="mx-auto mt-3 size-12">
                <svg viewBox="0 0 44 44" className="-rotate-90">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#f3e8e8" strokeWidth="4" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - autoCountdown / 10)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleForceSubmit}
                disabled={isSubmitting}
                className="mt-6 w-full rounded-xl bg-rose-500 py-3.5 text-sm font-black text-white shadow-md shadow-rose-500/30 transition hover:brightness-105 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang nộp…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">send</span>
                    Nộp bài ngay
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {isSubmitting && !showTimeUpModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e8e2e6] bg-white px-10 py-8 shadow-xl">
            <div className={`size-12 animate-spin rounded-full border-4 border-[#e8e2e6] ${theme.spinnerTop}`} />
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.colorText}`}>
              Đang nộp bài…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDetailPage;
