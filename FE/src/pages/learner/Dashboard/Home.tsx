import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerDashboardService } from '../../../services/Learner/learnerDashboardService';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { AISuggestions } from '../../../interfaces/Learner/Dashboard';

const LearnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [flashcardStats, setFlashcardStats] = useState({ dueCount: 0, totalCards: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [aiSuggestions, progress, decks] = await Promise.all([
          LearnerDashboardService.getAISuggestions(),
          LearnerDashboardService.getOverallProgress(),
          FlashcardService.getDecks()
        ]);
        
        setSuggestions(aiSuggestions);
        // Giả sử progress là một số hoặc object có totalProgress
        setOverallProgress(typeof progress === 'number' ? progress : (progress.totalProgress || 65));
        
        const totalDue = decks.reduce((acc: number, deck: any) => acc + deck.dueCount, 0);
        const totalCards = decks.reduce((acc: number, deck: any) => acc + deck.totalCards, 0);
        setFlashcardStats({ dueCount: totalDue, totalCards });
      } catch (err) {
          console.error("Lỗi khi tải dữ liệu dashboard:", err);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader title="Tổng quan" />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Welcome Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#181114] text-5xl font-black tracking-tight uppercase leading-none">Chào mừng trở lại!</h1>
              <p className="text-[#886373] text-lg font-medium">Bạn đã hoàn thành <span className="text-[#181114] font-black">{overallProgress}%</span> lộ trình học tập hôm nay.</p>
            </div>
            
            <div className="flex gap-4">
               <button 
                onClick={() => navigate('/learner/flashcards')}
                className="bg-white border-2 border-[#f4f0f2] text-[#181114] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:border-primary/30 transition-all shadow-sm active:scale-95"
               >
                <span className="material-symbols-outlined text-primary fill-1">style</span>
                Ôn tập ({flashcardStats.dueCount})
              </button>
              <button 
                onClick={() => navigate('/learner/skill-learning')}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl shadow-primary/20 active:scale-95"
              >
                Luyện tập ngay
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* AI Recommendation Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Primary AI Recommendation */}
              <div className="bg-[#181114] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group border-4 border-primary/20">
                <div className="flex flex-col h-full justify-between gap-12 relative z-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span> 
                      AI Đề xuất thông minh
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white text-4xl font-black uppercase tracking-tight leading-tight">
                        {overallProgress === 100 ? "Chúc mừng! Bạn đã sẵn sàng lên cấp N3" : "Tập trung: Phân biệt は và が"}
                      </h3>
                      <p className="text-zinc-400 text-lg leading-relaxed max-w-xl font-medium italic">
                        "{suggestions?.systemMessage || "Dựa trên các lỗi sai gần đây, bạn nên tập trung vào trợ từ để cải thiện điểm số trong bài thi sắp tới."}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pt-4">
                    <button 
                        onClick={() => navigate('/learner/skill-learning/grammar/practice')}
                        className="px-12 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                    >
                      Bắt đầu bài học
                    </button>
                    <div className="flex flex-col">
                        <span className="text-emerald-400 text-xl font-black">+50 XP</span>
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Thưởng hoàn thành</span>
                    </div>
                  </div>
                </div>
                {/* Decoration background */}
                <div className="absolute right-[-10%] top-[-20%] size-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/30 transition-all"></div>
              </div>

              {/* AI Insight Snippets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border-2 border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col gap-6 cursor-pointer" onClick={() => navigate('/learner/analytics/weakness')}>
                  <div className="size-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-100/50 border border-rose-100">
                    <span className="material-symbols-outlined text-3xl">troubleshoot</span>
                  </div>
                  <div>
                    <h4 className="text-[#181114] font-black uppercase tracking-tight text-lg mb-2">Điểm yếu cần khắc phục</h4>
                    <p className="text-[#886373] text-sm leading-relaxed font-medium italic">
                        "{suggestions?.weakPoints?.[0] || "Bạn đang gặp khó khăn ở các câu hỏi về Kanji N3."}"
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-[2.5rem] p-10 border-2 border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col gap-6 cursor-pointer" onClick={() => navigate('/learner/analytics/weakness')}>
                  <div className="size-14 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-100/50 border border-amber-100">
                    <span className="material-symbols-outlined text-3xl">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-[#181114] font-black uppercase tracking-tight text-lg mb-2">Tốc độ phản xạ</h4>
                    <p className="text-[#886373] text-sm leading-relaxed font-medium italic">
                        "{suggestions?.focusSuggestion || "Tốc độ trả lời của bạn đang ở mức khá tốt (3.2s)."}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Analytics & Stats */}
            <div className="space-y-10">
              {/* Mastery Progress Card */}
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border-2 border-[#f4f0f2] flex flex-col items-center text-center relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="relative z-10 w-full">
                  <h3 className="text-[#181114] text-xs font-black uppercase tracking-[0.2em] mb-10">Tiến độ trình độ N3</h3>
                  <div className="relative size-56 flex items-center justify-center mx-auto">
                    <svg className="size-full transform -rotate-90">
                      <circle className="text-[#f4f0f2]" cx="112" cy="112" r="95" fill="transparent" stroke="currentColor" strokeWidth="16" />
                      <circle 
                        className="text-primary" 
                        cx="112" 
                        cy="112" 
                        r="95" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="16" 
                        strokeDasharray="596.9" 
                        strokeDashoffset={596.9 - (596.9 * overallProgress) / 100} 
                        strokeLinecap="round" 
                        style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black text-[#181114]">{overallProgress}%</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-2">HOÀN THÀNH</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#886373] mt-10 font-black uppercase tracking-widest">
                    {overallProgress === 100 ? "Bạn đã sẵn sàng vượt vũ môn!" : "Hãy kiên trì mỗi ngày!"}
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#f4f0f2] shadow-sm flex flex-col items-center text-center space-y-3">
                    <span className="material-symbols-outlined text-orange-500 text-4xl fill-1">local_fire_department</span>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-[#181114]">12</span>
                        <span className="text-[8px] font-black text-[#886373] uppercase tracking-widest">Streak</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#f4f0f2] shadow-sm flex flex-col items-center text-center space-y-3">
                    <span className="material-symbols-outlined text-amber-500 text-4xl fill-1">military_tech</span>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-[#181114]">2.4k</span>
                        <span className="text-[8px] font-black text-[#886373] uppercase tracking-widest">XP</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearnerDashboard;
