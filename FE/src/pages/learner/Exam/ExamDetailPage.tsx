import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LearnerExamService } from '../../../services/Learner/examService';
import {ExamDisplayDTO,
        ExamTreeItemDTO,
        QuestionDisplayDTO,
        UserAnswerSelectionDTO,} from '../../../interfaces/Learner/Exam';
type RealQuestionItem = {question: QuestionDisplayDTO;parentQuestion: ExamTreeItemDTO;};
import { toast } from 'react-hot-toast';
import { Exam_Session_Service } from '../../../services/Learner/exam_SessionService';

const ExamDetailPage = () => {
  const { id, skillType } = useParams<{ id: string; skillType?: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [exam, setExam] = useState<ExamDisplayDTO | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerSelectionDTO>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionStartRef = useRef<Record<string, number>>({});

  const API_BASE_URL = "http://localhost:5167";

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  };

  useEffect(() => {
    if (id) {
      LearnerExamService.getExamQuestions(id).then((data) => {
        setExam(data);
        setTimeLeft(data.duration * 60);
      });
    }
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

    const realQuestions = useMemo<RealQuestionItem[]>(() => {
    if (!exam) return [];

    const result: RealQuestionItem[] = [];

    exam.sections.forEach((item) => {
        if (item.type === 'Normal') {
        result.push({
            question: {
            questionID: item.questionID!,
            content: item.content,
            imageURL: item.imageURL,
            options: item.options,
            subQuestions: [],
            questionType: 0 as any,
            questionFormat: 0 as any,
            totalSubQuestions: 0,
            },
            parentQuestion: item,
        });
        }

        if (item.type === 'Reading' || item.type === 'Listening') {
        item.subQuestions.forEach((sq) => {
            result.push({
            question: sq,
            parentQuestion: item,
            });
        });
        }
    });

    return result;
    }, [exam]);

    const allQuestionIds = useMemo(() => {
  return realQuestions.map(
    q => q.question.questionID
  );
}, [realQuestions]);

 useEffect(() => {
  if (!realQuestions.length) return;

  const current = realQuestions[currentIndex];

  const qid = current.question.questionID;

  if (!questionStartRef.current[qid]) {
    questionStartRef.current[qid] =
      Date.now();
  }
}, [realQuestions, currentIndex]);

  const getElapsedSeconds = (questionID: string) => {
    const start = questionStartRef.current[questionID] ?? Date.now();
    return Math.max(1, Math.floor((Date.now() - start) / 1000));
  };

  const handleSelectAnswer = (questionID: string, answerID: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionID]: {
        questionID,
        selectedAnswerID: answerID,
        responseTime: prev[questionID]?.responseTime && prev[questionID].responseTime > 0
          ? prev[questionID].responseTime
          : getElapsedSeconds(questionID),
      }
    }));
  };

 const isQuestionAnswered = (questionID: string) => {
  return !!userAnswers[questionID]
    ?.selectedAnswerID;
};

  const answeredCount = useMemo(() => {
  return realQuestions.filter(q =>
    isQuestionAnswered(
      q.question.questionID
    )
  ).length;
}, [realQuestions, userAnswers]);

  const handleSubmit = async () => {
    if (!exam || !id || isSubmitting) return;

    const totalQuestions = realQuestions.length;
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
      totalTimeSpent: (exam.duration * 60) - timeLeft,
      answers: normalizedAnswers,
    };

    try {
      setIsSubmitting(true);
      const result = await LearnerExamService.submitExam(id, request);
      const resultPath = skillType 
            ? `/learner/skill-learning/${skillType}/result/${result.resultID}`
            : `/learner/quiz/result/${result.resultID}`;

        navigate(resultPath, { 
            state: { 
                result, 
                examTitle: exam.title, 
                courseId: state?.courseId
            },
            replace: true 
        });
    } catch (error) {
      alert("Nộp bài thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = realQuestions[currentIndex];
  const currentQuestion = currentItem?.question;
  const parentQuestion = currentItem?.parentQuestion;
  const unansweredCount = realQuestions.length - answeredCount;
  const mm = Math.floor(timeLeft / 60);
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  if (!exam||!currentQuestion ||!parentQuestion) return <div>Loading...</div>;

  

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 bg-white border-b border-[#f4f0f2] px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold truncate uppercase">{exam.title}</h1>
            <span className="px-3 py-1 bg-background-light text-[10px] font-black rounded-full text-[#886370] border border-[#f4f0f2]">
              CÂU {currentIndex + 1} / {realQuestions.length}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[#886370]">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">Đã làm: {answeredCount}</span>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700">Chưa làm: {unansweredCount}</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-2 bg-background-light rounded-full border border-[#f4f0f2]">
              <span className="material-symbols-outlined text-primary text-base">timer</span>
              <span className="text-xl font-bold tabular-nums">{mm}:{ss}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">

          <section className="flex-1 overflow-y-auto p-10 bg-white/60 border-r border-[#f4f0f2]">
            <div className="max-w-3xl mx-auto">

              {parentQuestion.type !== 'Normal' && parentQuestion.content ? (
                <div className="japanese-text text-lg leading-[2.2] whitespace-pre-wrap p-6 bg-white border border-[#f4f0f2] rounded-3xl shadow-sm">
                    {parentQuestion.content}
                </div>
                ) : (
                <div className="text-center text-[#8f7f86] border border-dashed border-[#e7e1e4] rounded-3xl py-14 bg-white">
                    Câu hỏi này không có đoạn đọc/nghe đi kèm.
                </div>
                )}

                {parentQuestion.type === 'Listening' && parentQuestion.audioUrl && (
                <div className="mt-6 bg-white border border-[#f4f0f2] rounded-3xl p-6 shadow-sm">
                    <p className="text-[11px] font-black tracking-[0.2em] text-[#886370] uppercase mb-4">
                    Audio
                    </p>

                    <audio
                    controls
                    className="w-full"
                    src={getMediaUrl(parentQuestion.audioUrl)}
                    />
                </div>
                )}

                {currentQuestion.imageURL && (
                    <div className="mt-6 bg-white border border-[#f4f0f2] rounded-3xl p-6 shadow-sm">
                        <p className="text-[11px] font-black tracking-[0.2em] text-[#886370] uppercase mb-4">
                        Hình minh họa
                        </p>

                        <img
                        src={getMediaUrl(currentQuestion.imageURL)}
                        alt="Question"
                        className="w-full max-h-[28rem] object-contain rounded-2xl"
                        />
                    </div>
                    )}

            </div>

          </section>

          <section className="w-[32rem] overflow-y-auto p-10 bg-white shrink-0">
            <div className="flex flex-col gap-8">
              <div className="border border-[#f4f0f2] rounded-3xl p-7 shadow-sm">

                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">
                  Câu {currentIndex + 1}
                </h3>

                <p className="text-lg font-bold leading-relaxed mb-6 text-[#181114] min-h-[3.5rem]">
                  {currentQuestion.content}
                </p>

                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {currentQuestion.options.map((opt) => (
                      <label
                        key={opt.answerID}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer
                          ${userAnswers[currentQuestion.questionID]?.selectedAnswerID === opt.answerID
                            ? 'border-primary bg-primary/5'
                            : 'border-[#f4f0f2] hover:border-primary/30'}`}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          name={currentQuestion.questionID}
                          checked={userAnswers[currentQuestion.questionID]?.selectedAnswerID === opt.answerID}
                          onChange={() => handleSelectAnswer(currentQuestion.questionID, opt.answerID)}
                        />
                        <span className="font-medium text-[#3d2a31]">{opt.answerText}</span>
                      </label>
                    ))}
                  </div>
                )}

{/*                 {currentQuestion.subQuestions && currentQuestion.subQuestions.length > 0 && (
                  <div className="mt-8 space-y-8">
                    {currentQuestion.subQuestions.map((subQ, subIndex) => (
                      <div key={subQ.questionID} className="p-5 border border-[#f4f0f2] bg-[#fcfafb] rounded-2xl">
                        <p className="text-md font-bold mb-3 text-[#181114]">
                          {currentIndex + 1}.{subIndex + 1} {subQ.content}
                        </p>
                        <div className="flex flex-col gap-3">
                          {subQ.options.map((opt) => (
                            <label
                              key={opt.answerID}
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer bg-white
                                ${userAnswers[subQ.questionID]?.selectedAnswerID === opt.answerID
                                  ? 'border-primary bg-primary/5'
                                  : 'border-[#f4f0f2] hover:border-primary/30'}`}
                            >
                              <input
                                type="radio"
                                className="hidden"
                                name={subQ.questionID}
                                checked={userAnswers[subQ.questionID]?.selectedAnswerID === opt.answerID}
                                onChange={() => handleSelectAnswer(subQ.questionID, opt.answerID)}
                              />
                              <span className="text-sm font-medium">{opt.answerText}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )} */}
              </div>

              <div className="flex gap-3">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="flex-1 h-12 rounded-full border-2 border-[#f4f0f2] font-black text-[#6d5b62] disabled:opacity-30"
                >Quay lại</button>
                <button
                  disabled={currentIndex === realQuestions.length - 1}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="flex-1 h-12 rounded-full bg-primary text-white font-black disabled:opacity-40"
                >Tiếp theo</button>
              </div>
            </div>
          </section>
        </div>

        <footer className="h-20 bg-white border-t border-[#f4f0f2] p-8 flex justify-end items-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-12 h-12 bg-primary text-white font-black rounded-full hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
          </button>
        </footer>
      </main>

      <aside className="w-80 bg-background-light border-l border-[#f4f0f2] p-6 hidden lg:flex flex-col">
        <h3 className="text-[11px] font-black text-[#886370] uppercase mb-6 tracking-[0.18em]">Tiến độ bài làm</h3>
        <div className="grid grid-cols-5 gap-3">
          {realQuestions.map((item, i) => (
            <button
             key={item.question.questionID}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`aspect-square flex items-center justify-center rounded-xl border-2 font-black cursor-pointer transition-all
                ${
                  currentIndex === i
                    ? 'border-primary text-primary ring-4 ring-primary/10 bg-white'
                    : isQuestionAnswered(item.question.questionID)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-[#886370] border-[#f4f0f2] hover:border-primary/30'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[#f4f0f2] bg-white p-4 text-xs text-[#6d5b62] space-y-2">
          <p>Tổng câu: <span className="font-bold">{realQuestions.length}</span></p>
          <p>Đã làm: <span className="font-bold text-emerald-600">{answeredCount}</span></p>
          <p>Chưa làm: <span className="font-bold text-amber-600">{unansweredCount}</span></p>
          <p>Đáp án đã chọn: <span className="font-bold">{Object.keys(userAnswers).filter((k) => allQuestionIds.includes(k)).length}</span></p>
        </div>
      </aside>
    </div>
  );
};

export default ExamDetailPage;
