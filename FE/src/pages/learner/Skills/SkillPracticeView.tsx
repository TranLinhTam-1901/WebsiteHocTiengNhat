import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { SkillPracticeService } from '../../../services/Learner/skillPracticeService';
import { QuestionService } from '../../../services/Learner/questionService';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { useTimer } from '../../../hooks/useTimer';
import PracticeResultPage from './PracticeResultPage';

const SkillPracticeView: React.FC = () => {
    const { skillType } = useParams<{ skillType: string }>();
    const navigate = useNavigate();
    const { time, startTimer, stopTimer, resetTimer } = useTimer();
    
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [textAnswer, setTextAnswer] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showHint, setShowHint] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [sessionData, setSessionData] = useState<any[]>([]);

    const currentSkillType = useMemo(() => {
        const skillEnumMap: Record<string, SkillType> = {
            "vocabulary": SkillType.Vocabulary,
            "grammar": SkillType.Grammar,
            "kanji": SkillType.Kanji,
            "reading": SkillType.Reading,
            "listening": SkillType.Listening
        };
        return skillEnumMap[skillType || ""] || SkillType.General;
    }, [skillType]);

    useEffect(() => {
        const initSession = async () => {
            const savedFilters = sessionStorage.getItem('current_skill_filters');
            if (!savedFilters) {
                navigate(`/learner/skill-learning/${skillType}/select`);
                return;
            }

            const { filters } = JSON.parse(savedFilters);
            setLoading(true);
            try {
                const data = await SkillPracticeService.getQuestionsByFilter(filters);
                setQuestions(data);
                startTimer();
            } catch (error) {
                console.error("Lỗi khi tải câu hỏi:", error);
            } finally {
                setLoading(false);
            }
        };

        initSession();
    }, [skillType, navigate, startTimer]);

    const handleCheck = async () => {
        if (!selectedAnswer && !textAnswer.trim()) return;
        stopTimer();
        
        const currentQuestion = questions[currentIndex];
        setLoading(true);
        try {
            const checkResult = await QuestionService.checkAnswer({
                questionId: currentQuestion.id,
                selectedAnswerId: selectedAnswer,
                textAnswer: textAnswer,
                timeTaken: time
            });

            setResult(checkResult);
            setIsAnswered(true);
            
            // Lưu dữ liệu phiên học
            setSessionData(prev => [...prev, {
                question: currentQuestion,
                isCorrect: checkResult.isCorrect,
                timeTaken: time,
                selectedAnswer,
                textAnswer
            }]);

            // Nếu sai, AI tự động thêm vào SRS (hoặc server đã làm rồi, nhưng theo mô tả là FE gọi)
            if (!checkResult.isCorrect || time > 60) {
                await FlashcardService.addToDeck({
                    entityId: currentQuestion.entityID,
                    itemType: currentQuestion.questionType
                });
            }
        } catch (err) {
            console.error("Lỗi khi kiểm tra đáp án:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setTextAnswer('');
            setIsAnswered(false);
            setResult(null);
            setShowHint(false);
            resetTimer();
            startTimer();
        } else {
            setShowResults(true);
        }
    };

    const playAudio = (url: string) => {
        const audio = new Audio(url);
        audio.play();
    };

    if (showResults) {
        return <PracticeResultPage sessionData={sessionData} skillType={skillType || ''} />;
    }

    if (loading && questions.length === 0) return (
        <div className="flex h-screen items-center justify-center bg-background-light font-display">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xs font-black text-[#886373] uppercase tracking-[0.2em]">Đang chuẩn bị câu hỏi...</p>
            </div>
        </div>
    );

    if (questions.length === 0) return (
        <div className="flex flex-col h-screen items-center justify-center bg-[#fbf9fa] p-8 text-center font-display">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-dashed border-gray-200 max-w-md w-full">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                <h2 className="text-xl font-black text-[#181114] uppercase tracking-tight">Không tìm thấy câu hỏi</h2>
                <p className="text-[#886373] mt-2 font-medium">Thử thay đổi bộ lọc để có thêm câu hỏi luyện tập.</p>
                <button 
                    onClick={() => navigate(-1)} 
                    className="mt-8 w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-lg transition-all"
                >
                    Quay lại bộ lọc
                </button>
            </div>
        </div>
    );

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="bg-[#fbf9fa] text-[#181114] min-h-screen flex flex-col font-display">
            {/* Header */}
            <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-8">
                <div>
                    <h2 className="text-2xl font-black text-[#181114] tracking-tight uppercase">Luyện tập {skillType}</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-[#886373] text-xs font-black uppercase tracking-widest">Câu hỏi {currentIndex + 1} / {questions.length}</span>
                        <div className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined text-sm">timer</span>
                            <span className="text-xs font-black">{time}s</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => navigate(-1)}
                    className="size-12 flex items-center justify-center rounded-2xl bg-white border-2 border-[#f4f0f2] text-[#886373] hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>
            </div>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center px-8 pb-12 overflow-y-auto">
                <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl shadow-primary/5 border-2 border-[#f4f0f2] overflow-hidden">
                    <div className="w-full h-3 bg-[#f4f0f2]">
                        <div 
                            className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    
                    <div className="p-10 lg:p-16">
                        <div className="flex justify-between items-start mb-12">
                            <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                {currentQuestion.questionType === 4 ? 'Listening' : currentQuestion.questionType === 5 ? 'Reading' : 'Quiz'}
                            </span>
                            <button 
                                onClick={() => setShowHint(!showHint)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-lg ${showHint ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-white border-2 border-[#f4f0f2] text-[#886373] hover:border-primary hover:text-primary'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                                AI Gợi ý
                            </button>
                        </div>

                        {showHint && (
                            <div className="mb-10 p-8 bg-amber-50 rounded-4xl border-2 border-amber-100 flex gap-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="size-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                    <span className="material-symbols-outlined text-2xl">psychology</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">AI Suggestion</p>
                                    <p className="text-sm text-amber-900 font-bold leading-relaxed">{currentQuestion.hint || "Hãy tập trung vào cấu trúc ngữ pháp và ngữ cảnh của câu."}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-12 mb-12">
                            {/* Listening / Media Area */}
                            {currentQuestion.audioURL && (
                                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 flex flex-col items-center gap-6">
                                    <div className="size-20 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 animate-pulse">
                                        <span className="material-symbols-outlined text-4xl">graphic_eq</span>
                                    </div>
                                    <button 
                                        onClick={() => playAudio(currentQuestion.audioURL)}
                                        className="px-8 py-4 bg-white border-2 border-indigo-200 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined">play_circle</span>
                                        Phát âm thanh
                                    </button>
                                </div>
                            )}

                            {currentQuestion.imageURL && (
                                <div className="max-w-md mx-auto">
                                    <img src={currentQuestion.imageURL} alt="Question" className="w-full rounded-[2.5rem] border-4 border-[#f4f0f2] shadow-xl" />
                                </div>
                            )}

                            <div className="text-center">
                                <h3 className="text-[#181114] text-3xl md:text-4xl font-japanese font-black leading-relaxed">
                                    {currentQuestion.content}
                                </h3>
                            </div>
                        </div>

                        {/* Answer Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            {currentQuestion.answers?.map((answer: any) => {
                                let style = "bg-white border-[#f4f0f2] text-[#181114] hover:border-primary hover:shadow-xl";
                                if (isAnswered) {
                                    if (answer.isCorrect) style = "bg-emerald-50 border-emerald-500 text-emerald-700 font-black";
                                    else if (selectedAnswer === answer.id) style = "bg-rose-50 border-rose-500 text-rose-700 font-black opacity-80";
                                    else style = "bg-white border-[#f4f0f2] text-[#886373] opacity-40";
                                } else if (selectedAnswer === answer.id) {
                                    style = "border-primary bg-primary/5 text-primary ring-4 ring-primary/10 shadow-xl";
                                }

                                return (
                                    <button
                                        key={answer.id}
                                        onClick={() => !isAnswered && setSelectedAnswer(answer.id)}
                                        className={`px-8 py-6 rounded-4xl border-2 transition-all text-xl font-bold font-japanese text-left flex items-center justify-between group ${style}`}
                                    >
                                        <span>{answer.answerText}</span>
                                        {isAnswered && answer.isCorrect && (
                                            <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
                                        )}
                                        {isAnswered && selectedAnswer === answer.id && !answer.isCorrect && (
                                            <span className="material-symbols-outlined text-rose-500 text-3xl">cancel</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback */}
                        {isAnswered && (
                            <div className={`rounded-[2.5rem] p-10 mb-12 flex gap-8 animate-in slide-in-from-bottom-8 duration-700 ${result?.isCorrect ? 'bg-emerald-50 border-2 border-emerald-100' : 'bg-rose-50 border-2 border-rose-100'}`}>
                                <div className={`size-16 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl ${result?.isCorrect ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                                    <span className="material-symbols-outlined text-4xl">{result?.isCorrect ? 'check' : 'close'}</span>
                                </div>
                                <div className="space-y-3">
                                    <p className={`font-black uppercase text-xs tracking-widest ${result?.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {result?.isCorrect ? 'Chính xác! Làm tốt lắm' : 'Chưa đúng rồi! Hãy xem lời giải'}
                                    </p>
                                    <p className={`text-lg font-bold leading-relaxed ${result?.isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
                                        {result?.explanation || "Hãy xem lại kiến thức về cấu trúc này."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-10 border-t-2 border-[#f4f0f2]">
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#886373] hover:text-rose-600 flex items-center gap-2 transition-all group">
                                <span className="material-symbols-outlined text-[18px] group-hover:fill-1">report</span>
                                Báo lỗi câu hỏi
                            </button>
                            <div className="flex gap-4">
                                {!isAnswered ? (
                                    <button 
                                        onClick={handleCheck}
                                        disabled={!selectedAnswer && !textAnswer.trim()}
                                        className="px-14 py-5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all"
                                    >
                                        Kiểm tra
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleNext}
                                        className="px-14 py-5 rounded-2xl bg-[#181114] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:bg-[#2d2127] active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SkillPracticeView;
