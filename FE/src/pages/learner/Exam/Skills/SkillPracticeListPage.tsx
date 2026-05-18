import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { SkillPracticeService } from '../../../../services/Learner/skillPracticeService';
import { SkillPracticeExamDTO } from '../../../../interfaces/Learner/SkillPractice';

const SkillPracticeListPage: React.FC = () => {
    const { skillType } = useParams<{ skillType: string }>(); // Lấy từ URL: vocabulary, grammar...
    // console.log("Giá trị skillType lấy từ URL là:", skillType);
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<SkillPracticeExamDTO[]>([]);

    // Map tên skill trên URL sang ID để gọi API
    const skillNameMap: Record<string, number> = {
        "vocabulary": 1,
        "grammar": 2,
        "kanji": 3,
        "reading": 4,
        "listening": 5
    };

    useEffect(() => {
        // console.log("useEffect đang chạy với skillType:", skillType);
        const fetchExams = async () => {
            setLoading(true);
            try {
                const targetSkillId = skillNameMap[skillType || ""] || 1;
                
                const data = await SkillPracticeService.getSkillPracticeExams(targetSkillId);
                setExams(data);
            } catch (error) {
                console.error("Lỗi khi tải danh sách bài tập:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, [skillType]);

    const handleStartExam = (examId: string) => {
        // Chuyển hướng đến View làm bài trực tiếp
        navigate(`/learner/skill-learning/${skillType}/practice/${examId}`);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-[#fbf9fa]">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xs font-black text-[#886373] uppercase tracking-[0.2em]">Đang lấy danh sách bài tập...</p>
            </div>
        </div>
    );

    const handleViewResult = (resultId: string) => {
        // Điều hướng đến trang kết quả của kỹ năng
        navigate(`/learner/skill-learning/${skillType}/result/${resultId}`);
    };
    
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf9fa]">
            <LearnerHeader title={`Luyện tập ${skillType?.toUpperCase()}`} />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Phần tiêu đề trang */}
                    <div className="bg-white rounded-[3rem] border border-[#f4f0f2] shadow-sm overflow-hidden">
                        <div className="p-10 border-b border-[#f4f0f2] bg-[#fbf9fa] flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">Danh sách bài tập</h2>
                                <p className="text-[#886373] font-medium mt-1">Vượt qua các bài kiểm tra để nâng cao trình độ</p>
                            </div>
                            <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                <span className="material-symbols-outlined text-4xl">exercise</span>
                            </div>
                        </div>

                        {/* Danh sách các bài thi */}
                        <div className="p-8 space-y-4">
                        {exams.length > 0 ? (
                            exams.map((exam) => (
                                <div 
                                    key={exam.examID}
                                    className="group bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-6">
                                        {/* Trạng thái hoàn thành */}
                                        <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${exam.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <span className="material-symbols-outlined text-3xl">
                                                {exam.isCompleted ? 'check_circle' : 'pending'}
                                            </span>
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-[#181114]">{exam.title}</h3>
                                                {exam.hasNewVersion && (
                                                    <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Mới</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-[#886373] font-medium">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">timer</span>
                                                    {exam.duration} phút
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                    Điểm cao nhất: {exam.bestScore}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group Nút bấm */}
                                    <div className="flex flex-col items-end gap-2">
    
                                        {/* Thông báo nếu chưa đạt */}
                                        {!exam.isCompleted && exam.latestResultID && (
                                            <p className="text-xs text-red-400 font-bold text-right max-w-[260px]">
                                                Bạn chưa đạt yêu cầu. Hãy luyện tập lại.
                                            </p>
                                        )}

                                        {/* Thông báo đã hoàn thành */}
                                        {exam.isCompleted && (
                                            <p className="text-xs text-emerald-600 font-bold">
                                                Bạn đã hoàn thành bài kiểm tra này.
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3">

                                            {/* Luôn cho xem kết quả nếu có result */}
                                            {exam.latestResultID && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewResult(exam.latestResultID!)}
                                                    className="px-5 py-3 rounded-2xl border-2 border-[#f4f0f2] bg-white text-[#6b5a62] text-xs font-black uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all"
                                                >
                                                    Xem kết quả
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleStartExam(exam.examID)}
                                                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                                                    exam.isCompleted 
                                                    ? 'bg-white border-2 border-[#f4f0f2] text-[#886373] hover:border-primary hover:text-primary' 
                                                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105'
                                                }`}
                                            >
                                                {exam.isCompleted ? 'Luyện tập lại' : 'Bắt đầu'}
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>


                                </div>
                            ))
                        ) : (
                                <div className="text-center py-20">
                                    <span className="material-symbols-outlined text-6xl text-[#f4f0f2]">find_in_page</span>
                                    <p className="text-[#886373] font-bold mt-4">Hiện chưa có bài tập nào cho kỹ năng này.</p>
                                </div>
                            )}
                        </div>
                    </div>

                   
                </div>
            </main>
        </div>
    );
};

export default SkillPracticeListPage;