import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import dashboardService from '../../../services/Learner/progressService'; 
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { DashboardProgressResponse } from '../../../interfaces/Learner/Dashboard';

const LearnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardProgressResponse | null>(null);
  const [flashcardStats, setFlashcardStats] = useState({ dueCount: 0, totalCards: 0 });
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi đồng thời dữ liệu tiến độ 70/30 và dữ liệu Flashcards
        const [progressRes, decks] = await Promise.all([
          dashboardService.getOverallProgress(),
          FlashcardService.getDecks()
        ]);
        
        setData(progressRes.data);
        
        // Tính toán số thẻ cần ôn tập từ danh sách decks
        const totalDue = decks.reduce((acc: number, deck: any) => acc + (deck.dueCount || 0), 0);
        const totalCards = decks.reduce((acc: number, deck: any) => acc + (deck.totalCards || 0), 0);
        setFlashcardStats({ dueCount: totalDue, totalCards });
      } catch (err) {
          console.error("Lỗi khi tải dữ loyalty dashboard:", err);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tính toán offset cho vòng tròn tiến độ (stroke-dasharray="596.9")
  const calculateOffset = (percent: number) => {
    const radius = 95;
    const circumference = 2 * Math.PI * radius;
    return circumference - (circumference * percent) / 100;
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
      <div className="text-primary font-black animate-pulse">ĐANG TẢI DỮ LIỆU...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader title="Tổng quan" />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* 1. Header: Chào mừng & Nút hành động */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#181114] text-5xl font-black tracking-tight uppercase leading-none">Chào mừng trở lại!</h1>
              <p className="text-[#886373] text-lg font-medium">
                Bạn đã hoàn thành <span className="text-[#181114] font-black">{data?.totalPercent || 0}%</span> lộ trình học tập mục tiêu.
              </p>
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
                onClick={() => navigate('/learner/courses')}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl shadow-primary/20 active:scale-95"
              >
                Học bài mới
              </button>
            </div>


          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* CỘT TRÁI: AI ĐỀ XUẤT */}
            <div className="lg:col-span-2 space-y-8">
              {/* Card AI chính (Màu đen đặc trưng) */}
              <div className="bg-[#181114] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group border-4 border-primary/20">
                <div className="flex flex-col h-full justify-between gap-12 relative z-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span> 
                      AI Gợi ý thông minh
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white text-4xl font-black uppercase tracking-tight leading-tight">
                        {data?.totalPercent === 100 ? `Chúc mừng! Bạn đã sẵn sàng cho ${data?.currentLevelName}` : `Tiếp tục chinh phục ${data?.currentLevelName}`}
                      </h3>
                      <p className="text-zinc-400 text-lg leading-relaxed max-w-xl font-medium italic">
                        "Dựa trên tiến độ bài học ({data?.courseProgress.percentage}%) và kỹ năng Flashcard ({data?.skillProgress.percentage}%), bạn nên tập trung vào việc ôn tập các thẻ bài cũ để ghi nhớ sâu hơn."
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pt-4">
                    <button 
                        onClick={() => navigate('/learner/skill-learning')}
                        className="px-12 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                    >
                      Bắt đầu bài học mới
                    </button>
                    <div className="flex flex-col">
                        <span className="text-emerald-400 text-xl font-black">+50 XP</span>
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Thưởng hoàn thành</span>
                    </div>
                  </div>
                </div>
                {/* Decor nền */}
                <div className="absolute right-[-10%] top-[-20%] size-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/30 transition-all"></div>
              </div>

              {/* Grid 2 Card nhỏ: Phân tích chi tiết (Sử dụng dữ liệu thật từ API) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border-2 border-[#f4f0f2] shadow-sm hover:shadow-2xl transition-all flex flex-col gap-6">
                  <div className="size-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                  </div>
                  <div>
                    <h4 className="text-[#181114] font-black uppercase tracking-tight text-lg mb-2">Tiến độ bài học</h4>
                    <p className="text-[#886373] text-sm leading-relaxed font-medium italic">
                        Bạn đã hoàn thành {data?.courseProgress.completed}/{data?.courseProgress.total} bài học. 
                        ({data?.courseProgress.percentage}%)
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-[2.5rem] p-10 border-2 border-[#f4f0f2] shadow-sm hover:shadow-2xl transition-all flex flex-col gap-6">
                  <div className="size-14 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                    <span className="material-symbols-outlined text-3xl">style</span>
                  </div>
                  <div>
                    <h4 className="text-[#181114] font-black uppercase tracking-tight text-lg mb-2">Kỹ năng Flashcard</h4>
                    <p className="text-[#886373] text-sm leading-relaxed font-medium italic">
                        Bạn đã thuộc {data?.skillProgress.completed}/{data?.skillProgress.total} thẻ nhớ.
                        ({data?.skillProgress.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: ANALYTICS & STATS */}
            <div className="space-y-10">
              {/* Vòng tròn tiến độ tổng thể */}
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border-2 border-[#f4f0f2] flex flex-col items-center text-center relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="relative z-10 w-full">
                  <h3 className="text-[#181114] text-xs font-black uppercase tracking-[0.2em] mb-10">Tiến trình {data?.currentLevelName}</h3>
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
                        strokeDashoffset={calculateOffset(data?.totalPercent || 0)} 
                        strokeLinecap="round" 
                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black text-[#181114]">{data?.totalPercent || 0}%</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-2">TỔNG THỂ</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#886373] mt-10 font-black uppercase tracking-widest">
                    {data?.totalPercent === 100 ? "Sẵn sàng chinh phục đỉnh cao!" : "Kiên trì là chìa khóa!"}
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              </div>

              {/* Chỉ số Streak & XP (Hard-code mẫu) */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#f4f0f2] shadow-sm flex flex-col items-center text-center space-y-3">
                    <span className="material-symbols-outlined text-orange-500 text-4xl fill-1">local_fire_department</span>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-[#181114]">12</span>
                        <span className="text-[8px] font-black text-[#886373] uppercase tracking-widest">Ngày Streak</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#f4f0f2] shadow-sm flex flex-col items-center text-center space-y-3">
                    <span className="material-symbols-outlined text-amber-500 text-4xl fill-1">military_tech</span>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-[#181114]">2.4k</span>
                        <span className="text-[8px] font-black text-[#886373] uppercase tracking-widest">Kinh nghiệm</span>
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