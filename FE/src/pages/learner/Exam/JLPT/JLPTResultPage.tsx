import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ExamReviewQuestionDTO,
  ExamReviewTreeItemDTO,
  SubmitExamResultDTO,
} from '../../../../interfaces/Learner/Exam';
import { LearnerExamService } from '../../../../services/Learner/examService';

type ReviewQuestionItem = {
  question: ExamReviewQuestionDTO | ExamReviewTreeItemDTO;
  parent: ExamReviewTreeItemDTO;
  sectionName: string;
};

const JLPTResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<SubmitExamResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const API_BASE_URL = 'http://localhost:5167';

  const getMediaUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  useEffect(() => {
    let alive = true;

    const loadResult = async () => {
      if (!resultId) return;

      try {
        setLoading(true);
        setLoadError(null);

        const data = await LearnerExamService.getExamResult(resultId);

        if (alive) {
          setResult(data);
        }
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          'Không tải được kết quả JLPT.';
        if (alive) setLoadError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadResult();

    return () => {
      alive = false;
    };
  }, [resultId]);

  const realQuestions = useMemo<ReviewQuestionItem[]>(() => {
    if (!result) return [];

    const items: ReviewQuestionItem[] = [];

    result.sections.forEach((section) => {
      if (section.type === 'Normal') {
        items.push({
          question: section,
          parent: section,
          sectionName: section.skillType,
        });
        return;
      }

      section.subQuestions.forEach((subQ) => {
        items.push({
          question: subQ,
          parent: section,
          sectionName: section.skillType || section.type,
        });
      });
    });

    return items;
  }, [result]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fbf9fa]">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !result) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fbf9fa] p-6">
        <div className="bg-white rounded-3xl border border-[#f4f0f2] p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-black mb-3">
            Không tải được kết quả
          </h2>
          <p className="text-sm text-[#886373] mb-6">
            {loadError || 'Không có dữ liệu kết quả.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/learner/exams/jlpt-exams')}
            className="h-11 px-6 rounded-full bg-primary text-white font-black"
          >
            Về danh sách JLPT
          </button>
        </div>
      </div>
    );
  }

  const currentItem = realQuestions[currentIndex];
  const currentQuestion = currentItem?.question;
  const parent = currentItem?.parent;

  const wrongCount = result.totalQuestions - result.correctAnswers;
  const accuracy =
    result.totalQuestions > 0
      ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
      : 0;

  const mm = Math.floor(result.timeSpent / 60);
  const ss = (result.timeSpent % 60).toString().padStart(2, '0');

  const sectionScores = result.sectionScores ?? [];
  const failedSections = sectionScores.filter((s) => !s.isPassed);
  const failedByTotal =
    result.passingScore != null && result.score < result.passingScore;
  const failedBySection = failedSections.length > 0;

  if (!currentItem || !currentQuestion || !parent) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fbf9fa]">
        Không có câu hỏi để hiển thị.
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-[#fbf9fa] text-[#181114] font-display">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#f4f0f2] px-8 py-5 shrink-0">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#886373]">
                JLPT MOCK TEST RESULT
              </p>

              <h1 className="text-2xl font-black mt-1">
                {result.examTitle}
              </h1>

              {result.isPassed === true ? (
                <p className="mt-2 text-sm font-black text-emerald-600">
                  ĐẬU — Đạt tổng điểm và không bị điểm liệt.
                </p>
              ) : (
                <div className="mt-2 text-sm font-bold text-rose-600 space-y-1">
                  <p>CHƯA ĐẠT</p>

                  {failedByTotal && (
                    <p>
                      Tổng điểm chưa đạt: {result.score.toFixed(2)}/
                      {result.passingScore}
                    </p>
                  )}

                  {failedBySection && (
                    <p>
                      Không đạt điểm liệt:{' '}
                      {failedSections.map((s) => s.sectionName).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 min-w-[34rem]">
              <div className="rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] p-4">
                <p className="text-[10px] font-black uppercase text-[#886373]">
                  Tổng điểm
                </p>
                <p className="text-2xl font-black">
                  {result.score.toFixed(2)}
                </p>
                <p className="text-[11px] font-bold text-[#886373]">
                  Đậu: {result.passingScore ?? '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] p-4">
                <p className="text-[10px] font-black uppercase text-[#886373]">
                  Đúng
                </p>
                <p className="text-2xl font-black text-emerald-600">
                  {result.correctAnswers}
                </p>
              </div>

              <div className="rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] p-4">
                <p className="text-[10px] font-black uppercase text-[#886373]">
                  Sai
                </p>
                <p className="text-2xl font-black text-rose-600">
                  {wrongCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] p-4">
                <p className="text-[10px] font-black uppercase text-[#886373]">
                  Thời gian
                </p>
                <p className="text-2xl font-black">
                  {mm}:{ss}
                </p>
                <p className="text-[11px] font-bold text-[#886373]">
                  {accuracy}% chính xác
                </p>
              </div>
            </div>
          </div>

          {sectionScores.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-5">
              {sectionScores.map((section) => (
                <div
                  key={section.sectionName}
                  className={`rounded-2xl border p-4 ${
                    section.isPassed
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-rose-50 border-rose-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">
                        {section.sectionName}
                      </p>
                      <p className="text-2xl font-black mt-1">
                        {section.score.toFixed(2)}
                        <span className="text-sm text-[#886373]">
                          {' '}
                          / min {section.minScore}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-[#6b5a62] mt-1">
                        {section.correctAnswers}/{section.totalQuestions} câu đúng
                      </p>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${
                        section.isPassed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {section.isPassed ? 'Đạt' : 'Liệt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden">
          <section className="flex-1 overflow-y-auto p-10">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white rounded-3xl border border-[#f4f0f2] p-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                    {parent.skillType || parent.type}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-[#fbf9fa] border border-[#f4f0f2] text-[#6b5a62] text-xs font-black uppercase tracking-wider">
                    Câu {currentIndex + 1}/{realQuestions.length}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      currentQuestion.isCorrect
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {currentQuestion.isCorrect ? 'Đúng' : 'Sai'}
                  </span>
                </div>
              </div>

              {parent.type !== 'Normal' && parent.content && (
                <div className="bg-white rounded-[2rem] border border-[#f4f0f2] p-8 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-5">
                    Nội dung
                  </p>

                  <div className="whitespace-pre-wrap leading-[2.2] text-lg japanese-text">
                    {parent.content}
                  </div>
                </div>
              )}

              {parent.type === 'Listening' && parent.audioUrl && (
                <div className="bg-white rounded-[2rem] border border-[#f4f0f2] p-8 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-5">
                    Listening Audio
                  </p>

                  <audio
                    controls
                    className="w-full"
                    src={getMediaUrl(parent.audioUrl)}
                  />
                </div>
              )}

              {'imageUrl' in currentQuestion && currentQuestion.imageUrl && (
                <div className="bg-white rounded-[2rem] border border-[#f4f0f2] p-6 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-5">
                    Hình minh họa
                  </p>

                  <img
                    src={getMediaUrl(currentQuestion.imageUrl)}
                    alt="Question"
                    className="w-full max-h-[32rem] object-contain rounded-2xl"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="w-[34rem] shrink-0 border-l border-[#f4f0f2] bg-white overflow-y-auto p-8">
            <div className="space-y-8">
              <div className="border border-[#f4f0f2] rounded-[2rem] p-7 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] font-black text-primary mb-4">
                  Question {currentIndex + 1}
                </p>

                <h2 className="text-xl font-bold leading-relaxed mb-8">
                  {currentQuestion.content}
                </h2>

                <div className="space-y-4">
                  {currentQuestion.answers.map((opt) => (
                    <div
                      key={opt.answerID}
                      className={`p-5 rounded-2xl border-2 ${
                        opt.isCorrect
                          ? 'border-emerald-500 bg-emerald-50'
                          : opt.isSelected
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-[#f4f0f2]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium leading-relaxed">
                          {opt.answerText}
                        </p>

                        <div className="flex gap-2 shrink-0">
                          {opt.isSelected && (
                            <span className="text-xs font-black px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                              Bạn chọn
                            </span>
                          )}

                          {opt.isCorrect && (
                            <span className="text-xs font-black px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="flex-1 h-14 rounded-full border-2 border-[#f4f0f2] font-black text-[#6b5a62] disabled:opacity-30"
                >
                  Quay lại
                </button>

                <button
                  disabled={currentIndex === realQuestions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex-1 h-14 rounded-full bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-40"
                >
                  Tiếp theo
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/learner/exams/jlpt-exams')}
                className="w-full h-14 rounded-full bg-[#181114] text-white font-black hover:opacity-90 transition-all"
              >
                VỀ DANH SÁCH JLPT
              </button>
            </div>
          </section>
        </div>
      </main>

      <aside className="w-80 shrink-0 bg-white border-l border-[#f4f0f2] p-6 hidden xl:flex flex-col">
        <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-6">
          Danh sách câu hỏi
        </h3>

        <div className="grid grid-cols-5 gap-3 overflow-y-auto">
          {realQuestions.map((item, index) => {
            const isCurrent = currentIndex === index;
            const isCorrect = item.question.isCorrect;

            return (
              <button
                key={`${item.sectionName}-${index}`}
                onClick={() => setCurrentIndex(index)}
                className={`aspect-square rounded-xl border-2 font-black text-sm transition-all ${
                  isCurrent
                    ? 'border-primary bg-white text-primary ring-4 ring-primary/10'
                    : isCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-rose-500 border-rose-500 text-white'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#f4f0f2] bg-[#fbf9fa] p-4 text-xs text-[#6d5b62] space-y-2">
          <p>
            Đúng:{' '}
            <span className="font-black text-emerald-600">
              {result.correctAnswers}
            </span>
          </p>
          <p>
            Sai:{' '}
            <span className="font-black text-rose-600">
              {wrongCount}
            </span>
          </p>
          <p>
            Tổng câu:{' '}
            <span className="font-black">
              {result.totalQuestions}
            </span>
          </p>
        </div>
      </aside>
    </div>
  );
};

export default JLPTResultPage;