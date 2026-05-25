import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SubmitExamResultDTO } from '../../../interfaces/Learner/Exam';
import { LearnerExamService } from '../../../services/Learner/examService';

type ResultLocationState = {
  result?: SubmitExamResultDTO;
  examTitle?: string;
  courseId?: string;
};

const QuizResult: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { resultId } = useParams<{ resultId: string }>();
  const locationState = (state ?? {}) as ResultLocationState;
  const [result, setResult] = useState<SubmitExamResultDTO | null>(locationState.result ?? null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const courseId = locationState.courseId;
  const { skillType } = useParams<{ skillType?: string }>();

  const API_BASE_URL = "http://localhost:5167";

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";

    if (path.startsWith("http")) {
      return path;
    }

    return `${API_BASE_URL}${path}`;
  };

//   const handleBack = () => {
//   if (courseId) {
//     // Nếu có courseId, quay về trang chi tiết lộ trình của khóa học đó
//     navigate(`/learner/courses/${courseId}`);
//   } else {
//     // Fallback nếu không có courseId (ví dụ vào thẳng link) thì về danh sách tổng
//     navigate('/learner/courses');
//   }
// };
const handleBack = () => {
  // Ưu tiên 1: Nếu URL có skillType, quay về danh sách bài tập của Skill đó
  if (skillType) {
    navigate(`/learner/skill-learning/${skillType}/practice-list`);
    return;
  }

  // Ưu tiên 2: Nếu từ Course Quiz tới và có courseId trong state
  if (state?.courseId) {
    navigate(`/learner/courses/${state.courseId}`);
    return;
  }

  // Fallback: Về trang danh sách khóa học tổng
  navigate('/learner/courses');
};

const handleFinish = () => {
  if (skillType) {
    // Nếu đang ở trang luyện tập kỹ năng
    navigate(`/learner/skill-learning/${skillType}/practice-list`);
  } else {
    // Nếu đang ở trang luyện tập của course
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

  const examTitle = useMemo(() => {
    return locationState.examTitle ?? result?.examTitle ?? 'Bài thi JLPT';
  }, [locationState.examTitle, result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#f4f0f2] p-8 text-center">
          <h2 className="text-xl font-black text-[#211118] mb-3">Không tải được kết quả</h2>
          <p className="text-sm text-[#7a6a71] mb-6">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-11 px-6 rounded-full border-2 border-[#f4f0f2] font-black text-[#6b5a62]"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => navigate('/learner/courses')}
              className="h-11 px-6 rounded-full bg-primary text-white font-black"
            >
              Về khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#f4f0f2] p-8 text-center">
          <h2 className="text-xl font-black text-[#211118] mb-3">Không có dữ liệu kết quả</h2>
          <p className="text-sm text-[#7a6a71] mb-6">Vui lòng làm bài và nộp bài để xem trang kết quả.</p>
          <button
            type="button"
            onClick={() => navigate('/learner/courses')}
            className="h-11 px-6 rounded-full bg-primary text-white font-black"
          >
            Về danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  const accuracy = result.totalQuestions > 0
    ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
    : 0;
  const wrongCount = result.totalQuestions - result.correctAnswers;
  const mm = Math.floor(result.timeSpent / 60);
  const ss = (result.timeSpent % 60).toString().padStart(2, '0');
  const durationLabel = result.examDuration === 0 ? 'Luyện tập tự do' : `${result.examDuration} phút`;

  return (
    <div className="bg-background-light text-[#211118] min-h-screen font-display">
      <main className="max-w-6xl mx-auto w-full px-4 md:px-10 py-8 space-y-8">
        <section className="bg-white rounded-4xl p-8 border border-[#f4f0f2] shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#886373] mb-3">Kết quả bài thi</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            {examTitle}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="rounded-2xl border border-[#f4f0f2] p-4 bg-[#fbf9fa]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Kết quả</p>
              <p className="text-2xl font-black mt-1">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
              {/* <p className="text-[11px] font-bold text-[#7a6a71] mt-1">
                Điểm: {result.score.toFixed(2)}
              </p> */}
            </div>
            <div className="rounded-2xl border border-[#f4f0f2] p-4 bg-[#fbf9fa]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Đúng</p>
              <p className="text-2xl font-black mt-1 text-emerald-600">{result.correctAnswers}</p>
            </div>
            <div className="rounded-2xl border border-[#f4f0f2] p-4 bg-[#fbf9fa]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Sai</p>
              <p className="text-2xl font-black mt-1 text-rose-600">{wrongCount}</p>
            </div>
            <div className="rounded-2xl border border-[#f4f0f2] p-4 bg-[#fbf9fa]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Độ chính xác</p>
              <p className="text-2xl font-black mt-1">{accuracy}%</p>
            </div>
            <div className="rounded-2xl border border-[#f4f0f2] p-4 bg-[#fbf9fa]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#886373]">Thời gian</p>
              <p className="text-2xl font-black mt-1">{mm}:{ss}</p>
              <p className="text-[11px] font-bold text-[#7a6a71] mt-1">
                {durationLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black">Chi tiết đáp án</h2>
          {result.sections.map((section, index) => {
            if (section.type === 'Normal') {
              return (
                <article
                  key={section.questionID}
                  className={`bg-white rounded-3xl border p-6 ${
                    section.isCorrect ? 'border-emerald-100' : 'border-rose-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`size-8 rounded-lg flex items-center justify-center text-xs font-black ${
                          section.isCorrect
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {index + 1}
                      </span>

                      <p className="font-bold leading-relaxed">
                        {section.content}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                        section.isCorrect
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {section.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  </div>

                  <div className="space-y-3 mt-4">
                    {section.answers.map((opt) => (
                      <div
                        key={opt.answerID}
                        className={`p-4 rounded-2xl border-2 ${
                          opt.isCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : opt.isSelected
                            ? 'border-rose-400 bg-rose-50'
                            : 'border-[#f4f0f2]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium">{opt.answerText}</p>

                          <div className="flex gap-2">
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
                </article>
              );
            }

            return (
              <article
                key={`${section.type}-${index}`}
                className="bg-white rounded-3xl border border-[#f4f0f2] p-6"
              >
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-4">
                  {section.type}
                </h3>

                {section.content && (
                  <div className="mb-6 p-5 rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </div>
                )}

                {section.audioUrl && (
                  <audio controls className="w-full mb-6" src={getMediaUrl(section.audioUrl)} />
                )}

                {/* {section.imageURL && (
                  <div className="mb-6">
                    <img
                      src={getMediaUrl(section.imageURL)}
                      alt="Shared"
                      className="w-full rounded-2xl border border-[#f4f0f2] object-contain max-h-[28rem]"
                    />
                  </div>
                )} */}

                <div className="space-y-6">
                  {section.subQuestions.map((subQ, subIndex) => (
                    <div
                      key={subQ.questionID}
                      className={`rounded-2xl border p-5 ${
                        subQ.isCorrect ? 'border-emerald-100' : 'border-rose-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">

                        <p className="font-bold leading-relaxed">
                          {subIndex + 1}. {subQ.content}
                        </p>
                        
                        {subQ.imageUrl && (
                          <img
                            src={getMediaUrl(subQ.imageUrl)}
                            alt="Question"
                            className=" mt-4 w-full max-h-[24rem] object-contain rounded-2xl border border-[#f4f0f2]"
                          />
                        )}

                        <span
                          className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                            subQ.isCorrect
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {subQ.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {subQ.answers.map((opt) => (
                          <div
                            key={opt.answerID}
                            className={`p-4 rounded-xl border-2 ${
                              opt.isCorrect
                                ? 'border-emerald-500 bg-emerald-50'
                                : opt.isSelected
                                ? 'border-rose-400 bg-rose-50'
                                : 'border-[#f4f0f2]'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-4">
                              <p>{opt.answerText}</p>

                              <div className="flex gap-2">
                                {opt.isSelected && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-bold">
                                    Bạn chọn
                                  </span>
                                )}

                                {opt.isCorrect && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                    Đáp án đúng
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <div className="flex flex-wrap gap-3 justify-end pb-8">
          <button
            type="button"
           onClick={handleBack}
            className="h-11 px-6 rounded-full border-2 border-[#f4f0f2] font-black text-[#6b5a62]"
          >
            Quay lại
          </button>
          <button
            type="button"
           onClick={handleFinish}
            className="h-11 px-6 rounded-full bg-primary text-white font-black hover:opacity-90 transition-opacity"
          >
            {skillType ? 'Hoàn tất luyện tập' : 'Về khóa học'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizResult;