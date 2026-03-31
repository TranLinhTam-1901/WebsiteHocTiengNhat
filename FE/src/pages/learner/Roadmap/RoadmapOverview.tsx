import React from 'react';
import { Link } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';

const RoadmapPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background-light">
      <LearnerHeader>
        <div className="flex flex-col">
          <h2 className="text-[#181114] text-xl font-bold tracking-tight uppercase">Lộ trình học JLPT N3</h2>
          <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
            <span>Học tập</span> / <span className="text-primary font-bold">Lộ trình của tôi</span>
          </nav>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-hidden flex">
        {/* CENTER CONTENT */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
            <div className="max-w-4xl mx-auto min-h-[1200px] relative">
              {/* S-Curve Path SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 800 1200">
                <path 
                  d="M400 50 C 600 150, 600 350, 400 450 C 200 550, 200 750, 400 850 C 600 950, 600 1150, 400 1250" 
                  stroke="#f4f0f2" strokeWidth="12" strokeLinecap="round" 
                />
                <path 
                  d="M400 50 C 600 150, 600 350, 400 450 C 200 550, 200 750, 400 850" 
                  stroke="#f287ae" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.3"
                />
              </svg>

              {/* Node 1: Completed */}
              <div className="absolute top-[50px] left-[400px] -translate-x-1/2 -translate-y-1/2 group">
                <div className="size-16 bg-[#f287ae] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer ring-4 ring-white">
                  <span className="material-symbols-outlined fill-1">check</span>
                </div>
              </div>

              {/* Node 2: Completed */}
              <div className="absolute top-[250px] left-[550px] -translate-x-1/2 -translate-y-1/2 group">
                <div className="size-16 bg-[#f287ae] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer ring-4 ring-white">
                  <span className="material-symbols-outlined fill-1">check</span>
                </div>
              </div>

              {/* Node 3: Active (Current Focus) */}
              <div className="absolute top-[450px] left-[400px] -translate-x-1/2 -translate-y-1/2">
                <div className="size-20 bg-white rounded-full flex items-center justify-center text-[#f287ae] shadow-xl cursor-pointer ring-4 ring-[#f287ae] animate-[pulse_2s_infinite]">
                  <span className="material-symbols-outlined text-4xl">play_arrow</span>
                </div>
                <div className="absolute -top-4 left-24 w-60 bg-white p-5 rounded-2xl border-2 border-[#f287ae] shadow-2xl z-20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-[#f287ae] uppercase">Đang tập trung</p>
                    <span className="px-1.5 py-0.5 rounded bg-[#f287ae]/10 text-[9px] font-bold text-[#f287ae]">UNIT 3</span>
                  </div>
                  <p className="text-base font-bold text-[#181114] leading-tight">Kính ngữ & Khiêm nhường ngữ cơ bản</p>
                  <Link to="./:level">
                    <button className="w-full mt-3 bg-[#f287ae] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#e07198] transition-all">
                        Tiếp tục bài học
                    </button>
                  </Link>
                </div>
              </div>

              {/* Node 4: Locked */}
              <div className="absolute top-[650px] left-[250px] -translate-x-1/2 -translate-y-1/2 opacity-60">
                <div className="size-14 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 ring-4 ring-white border border-[#f4f0f2]">
                  <span className="material-symbols-outlined">lock</span>
                </div>
              </div>

              {/* Final: Goal */}
              <div className="absolute top-[1050px] left-[550px] -translate-x-1/2 -translate-y-1/2">
                <div className="size-24 bg-linear-to-br from-amber-300 to-orange-400 rounded-3xl rotate-12 flex items-center justify-center text-white shadow-2xl ring-4 ring-white">
                  <span className="material-symbols-outlined text-4xl -rotate-12 fill-1">emoji_events</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (Stats) */}
        <aside className="w-80 bg-white border-l border-[#f4f0f2] flex flex-col p-8 gap-8 overflow-y-auto">
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Dự báo</h3>
              </div>
              <p className="text-xs text-[#886373] font-medium uppercase tracking-wider">Ngày hoàn thành dự kiến</p>
              <p className="text-2xl font-black text-[#181114] mt-1">14 Tháng 10, 2026</p>
              <div className="mt-4 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100 uppercase tracking-wider">
                Sớm hơn 2 tuần
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-black px-2 uppercase tracking-tight text-[#181114]">Cột mốc quan trọng</h3>
            <div className="space-y-3">
              {[
                { title: 'Kiểm tra Từ vựng', desc: 'Thành thạo 300 từ N3', progress: 80, locked: false, icon: 'spellcheck' },
                { title: 'Luyện nghe hiểu', desc: 'Nghe tin tức tự nhiên', progress: 0, locked: true, icon: 'headphones' }
              ].map((m, i) => (
                <div key={i} className="bg-[#fbf9fa] p-4 rounded-xl border border-[#f4f0f2] flex gap-4 transition-all hover:shadow-sm">
                  <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${m.locked ? 'bg-zinc-200' : 'bg-primary/20'}`}>
                    <span className={`material-symbols-outlined ${m.locked ? 'text-zinc-400' : 'text-primary'}`}>
                      {m.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#181114]">{m.title}</p>
                    <p className="text-[11px] text-[#886373] mt-0.5">{m.desc}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-zinc-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${m.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#181114]">{m.locked ? 'Đã khóa' : `${m.progress}%`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto bg-[#181114] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-400 text-sm">lightbulb</span>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mẹo hàng ngày</h4>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed italic">"Shadowing trong 10 phút hôm nay sẽ giúp tăng khả năng ghi nhớ Kính ngữ lên 40%."</p>
            <button className="w-full mt-4 bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/5 uppercase tracking-wider">Luyện tập ngay</button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default RoadmapPage;