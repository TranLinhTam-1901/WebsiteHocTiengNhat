import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ExamStructuredDTO,
  JLPTPartDTO,
  QuestionDisplayDTO,
  UserAnswerSelectionDTO,
} from '../../../../interfaces/Learner/Exam';
import { LearnerExamService } from '../../../../services/Learner/examService';
import { Exam_Session_Service } from '../../../../services/Learner/exam_SessionService';
type RealQuestionItem = {
  question: QuestionDisplayDTO;
  parentQuestion: QuestionDisplayDTO;
  part: JLPTPartDTO;
  sectionName: string;
};
import { useRef } from 'react';

const JLPTExamTakingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamStructuredDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [userAnswers, setUserAnswers] = useState<
    Record<string, UserAnswerSelectionDTO>
  >({});

  const [timeLeft, setTimeLeft] = useState(0);

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isExamInProgress, setIsExamInProgress] = useState(true);

  const [showExitModal, setShowExitModal] = useState(false);

  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const API_BASE_URL = "http://localhost:5167";

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  };
  useEffect(() => {
  const fetchExam = async () => {
    try {

      if (!id) return;

      const sessionData = await Exam_Session_Service.getOrCreateSession(id);
      
    //   if (sessionData.status !== 0) {

    //   alert('Bài thi đã kết thúc.');

    //   navigate('/learner/exams');

    //   return;
    // }

      setSessionId(sessionData.sessionID);

      setTimeLeft(sessionData.remainingTime);

      // RESTORE ANSWERS
      const restoredAnswers: Record< string,UserAnswerSelectionDTO > = {};

      (sessionData.answers || []).forEach((a: any) => {

        restoredAnswers[a.questionID] = {
          questionID: a.questionID,

          selectedAnswerID:
            a.selectedAnswerID,

          textAnswer:
            a.textAnswer,

          responseTime:
            a.responseTime
        };
      });

      setUserAnswers(restoredAnswers);

      // LOAD EXAM STRUCTURE
      // const examData =
      //   await LearnerExamService
      //     .getExamQuestionsStructured(id);

      // // RESTORE EXAM
      // setExam(examData);
     setExam({
      examID: sessionData.examID,
      title: sessionData.title,
      duration: sessionData.duration,
      version: sessionData.version,
      sections: sessionData.exam
    });

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  fetchExam();

}, [id]);

  
  // TIMER
    useEffect(() => {

    if (!sessionId || isSubmitting) return;

    const timer = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {

          clearInterval(timer);

          handleSubmitExam(true);

          return 0;
        }

        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(timer);

  }, [sessionId, isSubmitting]);


    const answersRef = useRef(userAnswers);

    const isSavingRef = useRef(false);


    useEffect(() => {
    answersRef.current = userAnswers;
    }, [userAnswers]);

    useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      if (isSavingRef.current) return;
      try {

        isSavingRef.current = true;

        await Exam_Session_Service.saveProgress({

          sessionID: sessionId,

          answers:
            Object.values(
                answersRef.current
              )

        });

      } catch (error) {

        console.error(
          'Auto save failed',
          error
        );
      }finally {

        isSavingRef.current = false;
      }

    }, 15000);

    return () => clearInterval(interval);

  }, [sessionId]);

  

    const openExitModal = (
      path?: string
    ) => {

      if (!isExamInProgress) return;

      if (path) {

        setPendingPath(path);

      } else {

        setPendingPath(null);
      }

      setShowExitModal(true);
    };


    useEffect(() => {

    const handlePopState = () => {

      window.history.pushState(
        null,
        '',
        window.location.href
      );

      openExitModal();
    };

    const handleProtectedNavigation = (
      e: any
    ) => {

      openExitModal(
        e.detail.path
      );
    };

    // block browser back
    window.history.pushState(
      null,
      '',
      window.location.href
    );

    // listeners
    window.addEventListener(
      'popstate',
      handlePopState
    );

    window.addEventListener(
      'protected-navigation',
      handleProtectedNavigation
    );

    return () => {

      window.removeEventListener(
        'popstate',
        handlePopState
      );

      window.removeEventListener(
        'protected-navigation',
        handleProtectedNavigation
      );
    };

  }, [isExamInProgress]);


  useEffect(() => {

    sessionStorage.setItem(
      'isExamInProgress',
      'true'
    );

    return () => {

      sessionStorage.removeItem(
        'isExamInProgress'
      );
    };

  }, []);

  // FLATTEN REAL QUESTIONS
    const realQuestions = useMemo<RealQuestionItem[]>(() => {
    if (!exam) return [];

    const result: RealQuestionItem[] = [];

    exam.sections.forEach((item: any) => {
        
        // ======================
        // NORMAL QUESTION
        // ======================
        if (item.type === "Normal") {
        result.push({
            question: item,
            parentQuestion: item,
            part: {
            partKey: "normal",
            partName: item.skillType,
            totalQuestions: 1,
            } as any,
            sectionName: item.skillType,
        });
        }

        // ======================
        // READING GROUP
        // ======================
        else if (item.type === "Reading" || item.skillType === "Reading") {
        item.subQuestions.forEach((sq: any) => {
            result.push({
            question: sq,
            parentQuestion: item,
            part: {
                partKey: "reading",
                partName: "Reading",
                totalQuestions: item.subQuestions.length,
            } as any,
            sectionName: "Reading",
            });
        });
        }

        // ======================
        // LISTENING GROUP
        // ======================
        else if (item.type === "Listening") {
        item.subQuestions.forEach((sq: any) => {
            result.push({
            question: sq,
            parentQuestion: item,
            part: {
                partKey: "listening",
                partName: "Listening",
                totalQuestions: item.subQuestions.length,
            } as any,
            sectionName: "Listening",
            });
        });
        }
    });

    return result;
    }, [exam]);

    const currentItem = realQuestions[currentIndex];

    const currentQuestion = currentItem?.question;
    const parentItem = currentItem?.parentQuestion as any;
    
    const answeredCount = useMemo(() => {
        return realQuestions.filter(
        (q) =>
            !!userAnswers[q.question?.questionID]?.selectedAnswerID
        ).length;
    }, [realQuestions, userAnswers]);

    const handleSelectAnswer = (
        questionID: string,
        answerID: string
    ) => {
        setUserAnswers((prev) => ({
        ...prev,
        [questionID]: {
            questionID,
            selectedAnswerID: answerID,
            responseTime: 1,
        },
        }));
    };

    const handleSubmitExam = async ( forceSubmit = false) => {
      
      if (isSubmitting) return;
      setIsSubmitting(true);

    try {

        if (!sessionId) {
            alert("Không tìm thấy session.");
            return;
        }
        
       if (
          !forceSubmit &&
          answeredCount < realQuestions.length
        ) {
          alert(
            `Bạn còn ${
              realQuestions.length - answeredCount
            } câu chưa hoàn thành. Vui lòng làm hết bài trước khi nộp.`
          );

          setIsSubmitting(false);

          return;
        }

        const duration = Number(exam?.duration ?? 0);
        const spent = Math.max(
          0,
          Math.floor(duration * 60 - timeLeft)
        );

        const payload = {
          examID: id!,
          answers: Object.values(userAnswers),
          totalTimeSpent: spent
        };

        console.log("SUBMIT PAYLOAD:", payload);

        const result =
            await LearnerExamService.submitExam(
                 id!,
                 payload
            );
        await Exam_Session_Service.resetSession(
            sessionId
        );
        console.log(result);
        sessionStorage.removeItem(
          'isExamInProgress'
        );
        setIsExamInProgress(false);
        navigate(`/learner/exams/jlpt-exams/result/${result.resultID}`);
        
        
    } catch (error) {

        console.error(error);

        alert("Nộp bài thất bại.");
        setIsSubmitting(false);
    }
};

    if (loading) {
        return (
        <div className="h-screen flex items-center justify-center bg-[#fbf9fa]">
            <div className="flex flex-col items-center gap-4">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373]">
                Đang tải đề thi...
            </p>
            </div>
        </div>
        );
    }

    if (!exam || !currentQuestion || !parentItem) {
        return (
        <div className="h-screen flex items-center justify-center">
            Không tìm thấy đề thi.
        </div>
        );
    }

    const mm = Math.floor(timeLeft / 60);
    const ss = (timeLeft % 60)
        .toString()
        .padStart(2, '0');

    const progress =
        realQuestions.length > 0
        ? (answeredCount / realQuestions.length) * 100
        : 0;

  return (
    <> 
    <div className="h-screen overflow-hidden flex bg-[#fbf9fa] text-[#181114]">
      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-[#f4f0f2] px-8 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#886373]">
              JLPT MOCK TEST
            </p>

            <h1 className="text-xl font-black">
              {exam.title}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <span className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
                Đã làm: {answeredCount}
              </span>

              <span className="px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-xs font-black">
                Còn lại:{' '}
                {realQuestions.length - answeredCount}
              </span>
            </div>

            <div className="px-6 py-3 rounded-full border border-[#f4f0f2] bg-[#fbf9fa] flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                timer
              </span>

              <span className="text-xl font-black tabular-nums">
                {mm}:{ss}
              </span>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT CONTENT */}
          <section className="flex-1 overflow-y-auto p-10">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* SECTION INFO */}
              <div className="bg-white rounded-3xl border border-[#f4f0f2] p-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                    {parentItem.skillType || parentItem.type}
                  </span>

                  {/* <span className="px-3 py-1 rounded-full bg-[#fbf9fa] border border-[#f4f0f2] text-[#6b5a62] text-xs font-black uppercase tracking-wider">
                    {currentItem.part.partName}
                  </span> */}

                  <span className="px-3 py-1 rounded-full bg-[#fbf9fa] border border-[#f4f0f2] text-[#6b5a62] text-xs font-black uppercase tracking-wider">
                    Câu {currentIndex + 1}/
                    {realQuestions.length}
                  </span>
                </div>
              </div>

              {/* PASSAGE */}
              {parentItem.type !== "Normal" && parentItem.content && (
                <div className="bg-white rounded-[2rem] border border-[#f4f0f2] p-8 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-5">
                    Nội dung
                    </p>

                    <div className="whitespace-pre-wrap leading-[2.2] text-lg japanese-text">
                    {parentItem.content}
                    </div>
                </div>
                )}

              {/* AUDIO */}
              {parentItem.type === "Listening" && parentItem.audioUrl && (
                <div className="bg-white rounded-[2rem] border border-[#f4f0f2] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="material-symbols-outlined text-primary">
                      volume_up
                    </span>

                    <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373]">
                      Listening Audio
                    </p>
                  </div>

                  <audio
                    controls
                    className="w-full"
                     src={getMediaUrl(parentItem.audioUrl)}
                  />
                </div>
              )}

              {/* QUESTION IMAGE */}
              {currentItem.question.imageURL && (
                <div className="bg-white rounded-[2rem] border border-[#f4f0f2] p-6 shadow-sm">
                  
                  <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-5">
                    Hình minh họa
                  </p>

                  <img
                    src={getMediaUrl(currentItem.question.imageURL)}
                    alt="Question"
                    className="w-full max-h-[32rem] object-contain rounded-2xl"
                  />
                </div>
              )}
              
            </div>
          </section>

          {/* RIGHT QUESTION */}
          <section className="w-[34rem] shrink-0 border-l border-[#f4f0f2] bg-white overflow-y-auto p-8">
            <div className="space-y-8">
              {/* QUESTION */}
              <div className="border border-[#f4f0f2] rounded-[2rem] p-7 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] font-black text-primary mb-4">
                  Question {currentIndex + 1}
                </p>

                <h2 className="text-xl font-bold leading-relaxed mb-8">
                  {currentItem.question.content}
                </h2>

                {/* OPTIONS */}
                <div className="space-y-4">
                  {(currentItem.question.options ?? []).map((opt) => {
                    const isSelected =
                      userAnswers[
                        currentQuestion.questionID
                      ]?.selectedAnswerID === opt.answerID;

                    return (
                      <label
                        key={opt.answerID}
                        className={`
                          flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all
                          ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-[#f4f0f2] hover:border-primary/30'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          name={currentQuestion.questionID}
                          checked={isSelected}
                          onChange={() =>
                            handleSelectAnswer(
                              currentQuestion.questionID,
                              opt.answerID
                            )
                          }
                        />

                        <div
                          className={`
                            size-6 rounded-full border-2 shrink-0 mt-0.5
                            flex items-center justify-center
                            ${
                              isSelected
                                ? 'border-primary'
                                : 'border-[#d8cfd3]'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="size-3 rounded-full bg-primary"></div>
                          )}
                        </div>

                        <span className="font-medium leading-relaxed">
                          {opt.answerText}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* NAVIGATION */}
              <div className="flex gap-3">
                <button
                  disabled={currentIndex === 0}
                  onClick={() =>
                    setCurrentIndex((prev) => prev - 1)
                  }
                  className="flex-1 h-14 rounded-full border-2 border-[#f4f0f2] font-black text-[#6b5a62] disabled:opacity-30"
                >
                  Quay lại
                </button>

                <button
                  disabled={
                    currentIndex === realQuestions.length - 1
                  }
                  onClick={() =>
                    setCurrentIndex((prev) => prev + 1)
                  }
                  className="flex-1 h-14 rounded-full bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-40"
                >
                  Tiếp theo
                </button>
              </div>

              {/* SUBMIT */}
              <button
                className="w-full h-14 rounded-full bg-[#181114] text-white font-black hover:opacity-90 transition-all"
                 onClick={() => handleSubmitExam(false)}
              >
                NỘP BÀI
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* SIDEBAR */}
      <aside className="w-80 shrink-0 bg-white border-l border-[#f4f0f2] p-6 hidden xl:flex flex-col">
        <div className="mb-6">
          <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-[#886373] mb-4">
            Tiến độ bài thi
          </h3>

          <div className="h-3 rounded-full bg-[#f4f0f2] overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="text-xs font-bold text-[#886373] mt-3">
            {answeredCount}/{realQuestions.length} câu đã làm
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3 overflow-y-auto">
          {realQuestions.map((item, index) => {
            const answered =
              !!userAnswers[item.question.questionID]
                ?.selectedAnswerID;

            const isCurrent = currentIndex === index;

            return (
              <button
                key={item.question.questionID}
                onClick={() => setCurrentIndex(index)}
                className={`
                  aspect-square rounded-xl border-2 font-black text-sm transition-all
                  ${
                    isCurrent
                      ? 'border-primary bg-white text-primary ring-4 ring-primary/10'
                      : answered
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-[#f4f0f2] text-[#886373] hover:border-primary/30'
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </aside>
    </div>


{/* EXIT MODAL */}
    {showExitModal && (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">

        <div className="bg-white rounded-3xl p-8 w-[28rem] shadow-2xl">

          <h2 className="text-xl font-black mb-4">
            Rời khỏi bài thi?
          </h2>

          <p className="text-[#6b5a62] leading-relaxed mb-8">
            Thời gian làm bài vẫn sẽ tiếp tục tính ngay cả khi rời khỏi trang.
            Tiến trình hiện tại sẽ được lưu tự động.
          </p>

          <div className="flex gap-3">

            <button
              onClick={() => {
              setShowExitModal(false);
              setPendingPath(null);}}
              className="flex-1 h-12 rounded-full border border-[#f4f0f2]"
            >
              Tiếp tục làm bài
            </button>

            <button
              onClick={async () => {

                try {

                  if (sessionId) {

                    await Exam_Session_Service.saveProgress({
                      sessionID: sessionId,
                      answers: Object.values(answersRef.current)
                    });
                  }

                } catch (error) {

                  console.error(error);
                }

                setIsExamInProgress(false);

               navigate(pendingPath || '/learner/exams/jlpt-exams');
              }}
              className="flex-1 h-12 rounded-full bg-primary text-white font-bold"
            >
              Rời khỏi
            </button>
          </div>
        </div>
      </div>
    )}
     </>
  );
};

export default JLPTExamTakingPage;