import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlashcardService } from '../../../services/Learner/flashcardService';

interface PracticeResultPageProps {
    sessionData: any[];
    skillType: string;
}

const PracticeResultPage: React.FC<PracticeResultPageProps> = ({ sessionData, skillType }) => {
    const navigate = useNavigate();

    const stats = useMemo(() => {
        const correct = sessionData.filter(d => d.isCorrect).length;
        const total = sessionData.length;
        const avgTime = sessionData.reduce((acc, d) => acc + d.timeTaken, 0) / total;
        const mistakes = sessionData.filter(d => !d.isCorrect);
        
        // Nhóm các topic sai nhiều nhất
        const weakTopics: Record<string, number> = {};
        mistakes.forEach(m => {
            const topic = m.question.topicName || "Nội dung chung";
            weakTopics[topic] = (weakTopics[topic] || 0) + 1;
        });

        return {
            correct,
            total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
            avgTime: Math.round(avgTime),
            weakTopics: Object.entries(weakTopics).sort((a, b) => b[1] - a[1])
        };
    }, [sessionData]);

    const handleAddMistakesToFlashcards = async () => {
        const mistakes = sessionData.filter(d => !d.isCorrect);
        try {
            await Promise.all(mistakes.map(m => 
                FlashcardService.addToDeck({
                    entityId: m.question.entityID,
                    itemType: m.question.questionType
                })
            ));
            alert("Đã thêm các câu sai vào kho ôn tập!");
        } catch (error) {
            console.error("Lỗi khi thêm vào Flashcards:", error);
            alert("Có lỗi xảy ra khi thêm thẻ.");
        }
    };

    return (
        <div className="min-h-screen bg-[#fbf9fa] flex flex-col items-center py-20 px-8 font-display">
            <div className="w-full max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                    <div className="size-28 rounded-[2.5rem] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 animate-bounce">
                        <span className="material-symbols-outlined text-6xl">emoji_events</span>
                    </div>
                    <h2 className="text-4xl font-black text-[#181114] uppercase tracking-tight">Kết quả luyện tập</h2>
                    <p className="text-[#886373] font-black uppercase text-xs tracking-[0.3em]">Hoàn thành kỹ năng {skillType}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard 
                        label="Độ chính xác" 
                        value={`${stats.percentage}%`} 
                        icon="check_circle" 
                        color="text-emerald-500"
                        bg="bg-emerald-50"
                    />
                    <StatCard 
                        label="Đúng / Tổng" 
                        value={`${stats.correct} / ${stats.total}`} 
                        icon="quiz" 
                        color="text-primary"
                        bg="bg-primary/10"
                    />
                    <StatCard 
                        label="TG Trung bình" 
                        value={`${stats.avgTime}s`} 
                        icon="timer" 
                        color="text-amber-500"
                        bg="bg-amber-50"
                    />
                </div>

                <div className="bg-white rounded-[3rem] border-2 border-[#f4f0f2] p-10 shadow-sm overflow-hidden relative">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#181114] uppercase tracking-tight">AI Phân tích</h3>
                                </div>
                                <p className="text-[#886373] font-medium leading-relaxed">
                                    {stats.percentage === 100 
                                        ? "Tuyệt vời! Bạn đã nắm vững các kiến thức này. AI khuyên bạn nên chuyển sang cấp độ khó hơn hoặc thử kỹ năng mới."
                                        : stats.percentage >= 80
                                        ? "Kết quả rất tốt! Bạn chỉ còn một vài lỗ hổng nhỏ. Hãy luyện tập thêm các câu sai để đạt 100%."
                                        : "Đừng nản chí! Kết quả này cho thấy bạn đang gặp khó khăn ở một số chủ đề cụ thể. AI đã liệt kê bên dưới để bạn dễ dàng theo dõi."}
                                </p>
                            </div>

                            {stats.weakTopics.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[#886373] uppercase tracking-widest">Chủ đề cần cải thiện</p>
                                    <div className="flex flex-wrap gap-3">
                                        {stats.weakTopics.map(([name, count]) => (
                                            <div key={name} className="px-5 py-2.5 rounded-2xl bg-[#fbf9fa] border-2 border-[#f4f0f2] flex items-center gap-3">
                                                <span className="text-sm font-black text-[#181114]">{name}</span>
                                                <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-black">{count} lỗi</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={handleAddMistakesToFlashcards}
                                    disabled={sessionData.filter(d => !d.isCorrect).length === 0}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-[18px]">style</span>
                                    Thêm câu sai vào Flashcards
                                </button>
                                <button 
                                    onClick={() => navigate(`/learner/skill-learning`)}
                                    className="px-8 py-4 bg-[#181114] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-[#2d2127] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    Học kỹ năng khác
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                        <div className="w-full md:w-1/3 flex flex-col items-center gap-6">
                            <div className="relative size-48">
                                <svg className="size-full" viewBox="0 0 36 36">
                                    <path className="stroke-gray-100" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="stroke-primary" strokeDasharray={`${stats.percentage}, 100`} strokeLinecap="round" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-[#181114]">{stats.percentage}%</span>
                                    <span className="text-[8px] font-black text-[#886373] uppercase tracking-widest">Mục tiêu</span>
                                </div>
                            </div>
                            <p className="text-center text-xs font-bold text-[#886373]">Dữ liệu được phân tích bởi AI</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg }) => (
    <div className="bg-white rounded-[2.5rem] p-8 border-2 border-[#f4f0f2] shadow-sm flex flex-col items-center text-center space-y-4">
        <div className={`size-14 rounded-3xl ${bg} ${color} flex items-center justify-center shadow-lg shadow-current/10`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
            <div className={`text-3xl font-black text-[#181114]`}>{value}</div>
            <p className="text-[10px] font-black text-[#886373] uppercase tracking-widest mt-1">{label}</p>
        </div>
    </div>
);

export default PracticeResultPage;
