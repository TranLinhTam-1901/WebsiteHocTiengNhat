import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerDashboardService } from '../../../services/Learner/learnerDashboardService';
import { AISuggestions } from '../../../interfaces/Learner/Dashboard';

const WeaknessAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const data = await LearnerDashboardService.getAISuggestions();
                setSuggestions(data);
            } catch (error) {
                console.error("Lỗi khi tải gợi ý AI:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, []);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#fbf9fa]">
            <LearnerHeader title="Phân tích điểm mù" />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-10">
                    {/* AI Message */}
                    <div className="bg-[#181114] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-12 items-center">
                        <div className="relative z-10 size-24 shrink-0 bg-white/10 rounded-3xl border border-white/20 flex items-center justify-center text-primary backdrop-blur-xl shadow-inner animate-pulse">
                            <span className="material-symbols-outlined text-6xl">psychology</span>
                        </div>
                        <div className="relative z-10 space-y-4 flex-1">
                            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">AI Insight</h2>
                            <p className="text-lg font-medium text-zinc-300 italic leading-relaxed">
                                "{suggestions?.systemMessage || "Dựa trên lịch sử học tập, phản xạ của bạn ở một số phần đang chậm lại. Hãy tập trung luyện tập các phần này để tối ưu hóa bộ nhớ."}"
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <span className="material-symbols-outlined text-[14px] fill-1">verified</span>
                                Đã phân tích từ {suggestions?.reviewCount || 150} lượt trả lời
                            </div>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] size-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Weak Points List */}
                        <div className="bg-white rounded-[2.5rem] border-2 border-[#f4f0f2] p-10 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-2xl font-black text-[#181114] uppercase tracking-tight">Kỹ năng yếu</h3>
                                <p className="text-[#886373] font-medium mt-1">Các phần bạn hay trả lời sai nhất</p>
                            </div>
                            
                            <div className="space-y-4">
                                {(suggestions?.weakPoints || ["Trợ từ ga/wa", "Kính ngữ N2", "Động từ nhóm 3", "Kanji bộ thủ khó"]).map((point, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-3xl group hover:border-rose-200 transition-all cursor-pointer shadow-sm active:scale-95">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg shadow-rose-100 group-hover:shadow-rose-500/20">
                                                <span className="material-symbols-outlined text-xl">warning</span>
                                            </div>
                                            <span className="font-black text-[#181114] uppercase tracking-tight">{point}</span>
                                        </div>
                                        <button className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Luyện tập</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Speed Analysis */}
                        <div className="bg-white rounded-[2.5rem] border-2 border-[#f4f0f2] p-10 shadow-sm space-y-8 flex flex-col">
                            <div>
                                <h3 className="text-2xl font-black text-[#181114] uppercase tracking-tight">Tốc độ phản xạ</h3>
                                <p className="text-[#886373] font-medium mt-1">Thời gian trả lời trung bình của bạn</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
                                <div className="size-48 rounded-full border-10 border-[#fbf9fa] flex items-center justify-center relative shadow-inner">
                                    <div className="absolute inset-[-10px] rounded-full border-10 border-primary border-r-transparent border-b-transparent rotate-20"></div>
                                    <div className="text-center">
                                        <div className="text-5xl font-black text-[#181114]">3.2s</div>
                                        <span className="text-[9px] font-black text-[#886373] uppercase tracking-widest mt-1">Trung bình</span>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-[#181114] text-center max-w-xs leading-relaxed">
                                    {suggestions?.focusSuggestion || "Tốc độ của bạn đang nhanh hơn 15% so với tuần trước. Bạn đang làm rất tốt việc ghi nhớ phản xạ!"}
                                </p>
                            </div>

                            <button 
                                onClick={() => navigate('/learner/skill-learning')}
                                className="w-full py-5 rounded-3xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined text-[18px]">bolt</span>
                                Cải thiện ngay bây giờ
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WeaknessAnalysis;
