import React from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';

const Leaderboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full bg-[#fbf9fa]">
            <LearnerHeader title="Bảng xếp hạng" />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
                    
                    {/* Rankings Side */}
                    <div className="flex-1 space-y-8 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">Xếp hạng Toàn cầu</h2>
                                <p className="text-[#886373] font-medium mt-1">Khẳng định trình độ của bạn với thế giới</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-5 py-2.5 rounded-2xl bg-white border-2 border-[#f4f0f2] text-xs font-black uppercase tracking-widest text-primary shadow-sm">Tuần</button>
                                <button className="px-5 py-2.5 rounded-2xl bg-[#fbf9fa] border-2 border-[#f4f0f2] text-xs font-black uppercase tracking-widest text-[#886373] hover:text-[#181114] transition-all">Tháng</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] border-2 border-[#f4f0f2] p-6 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar p-2">
                                {/* Top 1 */}
                                <div className="flex items-center gap-6 p-6 rounded-4xl bg-amber-50 border-2 border-amber-100 shadow-lg shadow-amber-100/20 relative group scale-[1.02]">
                                    <div className="size-12 rounded-2xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                        <span className="material-symbols-outlined text-3xl fill-1">military_tech</span>
                                    </div>
                                    <div className="size-16 rounded-full border-4 border-amber-400 p-0.5 shrink-0 shadow-sm relative overflow-hidden">
                                        <img alt="User 1" className="w-full h-full rounded-full object-cover" src="https://i.pravatar.cc/150?u=1"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xl font-black text-[#181114] uppercase tracking-tight">Haruto Sato</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-white text-[8px] font-black uppercase tracking-widest">Master III</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-[#181114]">12,492</p>
                                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">XP</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12 scale-150">
                                        <span className="material-symbols-outlined text-8xl">emoji_events</span>
                                    </div>
                                </div>

                                {/* Top 2 */}
                                <div className="flex items-center gap-6 p-6 rounded-4xl hover:bg-[#fbf9fa] transition-all border-2 border-transparent hover:border-[#f4f0f2] group cursor-pointer">
                                    <div className="size-12 rounded-2xl bg-zinc-100 text-[#886373] flex items-center justify-center shrink-0 group-hover:bg-[#181114] group-hover:text-white transition-all shadow-sm">
                                        <span className="text-xl font-black">2</span>
                                    </div>
                                    <div className="size-14 rounded-full border-4 border-[#f4f0f2] p-0.5 shrink-0 shadow-sm">
                                        <img alt="User 2" className="w-full h-full rounded-full object-cover" src="https://i.pravatar.cc/150?u=2"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-black text-[#181114] uppercase tracking-tight">Emma Wilson</p>
                                        <p className="text-[10px] text-[#886373] font-black uppercase tracking-widest mt-1">Expert I</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[#181114]">11,204</p>
                                        <p className="text-[10px] text-[#886373] font-black uppercase tracking-widest mt-1">XP</p>
                                    </div>
                                </div>

                                {/* Top 3 */}
                                <div className="flex items-center gap-6 p-6 rounded-4xl hover:bg-[#fbf9fa] transition-all border-2 border-transparent hover:border-[#f4f0f2] group cursor-pointer">
                                    <div className="size-12 rounded-2xl bg-zinc-100 text-[#886373] flex items-center justify-center shrink-0 group-hover:bg-[#181114] group-hover:text-white transition-all shadow-sm">
                                        <span className="text-xl font-black">3</span>
                                    </div>
                                    <div className="size-14 rounded-full border-4 border-[#f4f0f2] p-0.5 shrink-0 shadow-sm">
                                        <img alt="User 3" className="w-full h-full rounded-full object-cover" src="https://i.pravatar.cc/150?u=3"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-black text-[#181114] uppercase tracking-tight">Min-ho Park</p>
                                        <p className="text-[10px] text-[#886373] font-black uppercase tracking-widest mt-1">Expert I</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[#181114]">10,850</p>
                                        <p className="text-[10px] text-[#886373] font-black uppercase tracking-widest mt-1">XP</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-[#181114] rounded-4xl text-white shadow-2xl relative z-10 flex items-center gap-6 border-4 border-primary/20 scale-[1.05]">
                                <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                                    <span className="text-xl font-black">14</span>
                                </div>
                                <div className="size-14 rounded-full border-2 border-white/50 p-0.5 shrink-0 shadow-sm relative overflow-hidden">
                                    <img alt="Me" className="w-full h-full rounded-full object-cover" src="https://i.pravatar.cc/150?u=me"/>
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-black uppercase tracking-tight">Tanaka Kenji</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-lg bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/30">Diamond II</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">BẠN</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black">7,240</p>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">XP</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Nav Side */}
                    <div className="w-full lg:w-[400px] space-y-8">
                        <div>
                            <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">Thống kê khác</h2>
                            <p className="text-[#886373] font-medium mt-1">Theo dõi hành trình của bạn</p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <NavCard 
                                onClick={() => navigate('/learner/analytics/statistics')}
                                title="Lịch sử tăng trưởng"
                                desc="Xem xu hướng học tập trong 30 ngày qua"
                                icon="analytics"
                                color="text-primary"
                                bg="bg-primary/10"
                            />
                            <NavCard 
                                onClick={() => navigate('/learner/analytics/weakness')}
                                title="Phân tích điểm mù"
                                desc="Khám phá các phần bạn đang gặp khó khăn"
                                icon="troubleshoot"
                                color="text-amber-600"
                                bg="bg-amber-100"
                            />
                            <div className="bg-[#181114] rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
                                <div className="relative z-10 space-y-6">
                                    <div className="size-14 rounded-3xl bg-white/10 flex items-center justify-center text-primary shadow-inner border border-white/10 backdrop-blur-md">
                                        <span className="material-symbols-outlined text-3xl">psychology</span>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black uppercase tracking-tight">Gợi ý lộ trình</h3>
                                        <p className="text-sm font-medium text-zinc-400 leading-relaxed italic">
                                            "Phản xạ của bạn ở nhóm động từ N3 đang chậm lại 12%. Hãy dành ít nhất 15 phút luyện tập mỗi ngày để cải thiện."
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/learner/skill-learning')}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Bắt đầu luyện tập
                                    </button>
                                </div>
                                <div className="absolute top-[-10%] right-[-10%] size-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavCard = ({ onClick, title, desc, icon, color, bg }: any) => (
    <button 
        onClick={onClick}
        className="w-full bg-white rounded-[2.5rem] border-2 border-[#f4f0f2] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all flex items-center gap-6 group text-left active:scale-95"
    >
        <div className={`size-14 rounded-3xl ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-current/10`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
            <h4 className="text-lg font-black text-[#181114] uppercase tracking-tight">{title}</h4>
            <p className="text-sm font-medium text-[#886373] mt-1">{desc}</p>
        </div>
        <span className="material-symbols-outlined text-[#886373] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">arrow_forward</span>
    </button>
);

export default Leaderboard;
