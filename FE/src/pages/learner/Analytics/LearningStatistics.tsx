import React from 'react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';

const LearningStatistics: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#fbf9fa]">
            <LearnerHeader title="Thống kê học tập" />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Correct Answers Chart (Simplified) */}
                        <div className="bg-white rounded-[2.5rem] border-2 border-[#f4f0f2] p-10 shadow-sm">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-[#181114] uppercase tracking-tight">Số câu đúng</h3>
                                    <p className="text-[#886373] font-medium mt-1">Xu hướng trong 7 ngày qua</p>
                                </div>
                                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                                    <span className="material-symbols-outlined text-2xl">trending_up</span>
                                </div>
                            </div>
                            
                            <div className="h-64 flex items-end justify-between gap-4 pt-4">
                                {[45, 60, 30, 80, 55, 90, 75].map((val, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4">
                                        <div 
                                            className="w-full bg-primary/20 rounded-t-xl relative group"
                                            style={{ height: `${val}%` }}
                                        >
                                            <div className="absolute inset-0 bg-primary rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-[10px] font-black text-white">{val}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-[#886373] uppercase tracking-widest">T{i+2}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Skill Distribution (Simplified) */}
                        <div className="bg-white rounded-[2.5rem] border-2 border-[#f4f0f2] p-10 shadow-sm">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-[#181114] uppercase tracking-tight">Phân bổ kỹ năng</h3>
                                    <p className="text-[#886373] font-medium mt-1">Tỷ lệ các kỹ năng đã nắm vững</p>
                                </div>
                                <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <span className="material-symbols-outlined text-2xl">pie_chart</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <SkillProgress label="Từ vựng" percentage={75} color="bg-rose-500" />
                                <SkillProgress label="Ngữ pháp" percentage={45} color="bg-amber-500" />
                                <SkillProgress label="Hán tự" percentage={60} color="bg-emerald-500" />
                                <SkillProgress label="Nghe hiểu" percentage={30} color="bg-sky-500" />
                                <SkillProgress label="Đọc hiểu" percentage={20} color="bg-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div className="bg-[#181114] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="space-y-6 flex-1">
                                <h3 className="text-4xl font-black uppercase tracking-tight">Tình trạng học tập</h3>
                                <p className="text-zinc-400 font-medium max-w-xl leading-relaxed">
                                    Bạn đã hoàn thành <span className="text-primary font-black">65%</span> lộ trình trình độ <span className="text-white font-black">N3</span>. 
                                    Với tốc độ hiện tại, AI dự đoán bạn sẽ sẵn sàng cho kỳ thi JLPT trong khoảng <span className="text-emerald-400 font-black">45 ngày</span> tới.
                                </p>
                                <div className="flex gap-4">
                                    <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                        <span className="text-3xl font-black text-primary">12</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Chuỗi ngày</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Streak</span>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                        <span className="text-3xl font-black text-emerald-400">2.4k</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tổng điểm</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">XP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative size-48 shrink-0">
                                <svg className="size-full" viewBox="0 0 36 36">
                                    <path className="stroke-white/10" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="stroke-primary" strokeDasharray="65, 100" strokeLinecap="round" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black">65%</span>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Hoàn thành</span>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-[-20%] right-[-10%] size-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-[-20%] left-[-10%] size-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const SkillProgress = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-end">
            <span className="text-xs font-black text-[#181114] uppercase tracking-widest">{label}</span>
            <span className="text-sm font-black text-primary">{percentage}%</span>
        </div>
        <div className="w-full h-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-full overflow-hidden shadow-inner">
            <div 
                className={`h-full ${color} transition-all duration-1000 ease-out shadow-lg shadow-current/20`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    </div>
);

export default LearningStatistics;
