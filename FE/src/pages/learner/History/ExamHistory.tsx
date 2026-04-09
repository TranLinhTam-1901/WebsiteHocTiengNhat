import React from 'react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';

// --- Sub-components ---

const StatCard = ({ icon, label, value, iconColorClass, bgColorClass }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`size-12 rounded-full ${bgColorClass} flex items-center justify-center`}>
      <span className={`material-symbols-outlined ${iconColorClass}`}>{icon}</span>
    </div>
    <div>
      <p className="text-[10px] text-[#886373] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-[#181114] leading-tight">{value}</p>
    </div>
  </div>
);

const ExamRow = ({ date, time, level, title, score, duration, scoreColor }: any) => (
  <tr className="hover:bg-[#fbf9fa] transition-colors border-b border-[#f4f0f2] last:border-0 group">
    <td className="px-8 py-5">
      <p className="text-sm font-bold text-[#181114]">{date}</p>
      <p className="text-[10px] text-[#886373] font-medium uppercase">{time}</p>
    </td>
    <td className="px-8 py-5">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${level === 'N4' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-primary/10 text-primary border border-primary/20'}`}>
          {level}
        </span>
        <p className="text-sm font-bold text-[#181114] group-hover:text-primary transition-colors">{title}</p>
      </div>
    </td>
    <td className="px-8 py-5">
      <div className="flex items-center gap-3">
        <div className="w-20 bg-[#f4f0f2] h-1.5 rounded-full overflow-hidden shrink-0">
          <div className={`${scoreColor} h-full transition-all duration-1000`} style={{ width: `${score}%` }}></div>
        </div>
        <span className="text-sm font-black text-[#181114]">{score}%</span>
      </div>
    </td>
    <td className="px-8 py-5">
      <span className="text-xs font-bold text-[#886373] uppercase tracking-wider">{duration}</span>
    </td>
    <td className="px-8 py-5 text-right">
      <button className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group/btn">
        Xem phân tích
        <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">auto_awesome</span>
      </button>
    </td>
  </tr>
);

// --- Main Page Component ---

const ExamHistory = () => {
  return (
    <div className="flex flex-col h-full bg-background-light">
      <LearnerHeader>
        <div className="flex flex-col">
          <h2 className="text-[#181114] text-xl font-bold tracking-tight uppercase">Lịch sử kiểm tra</h2>
          <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
            <span>Học tập</span> / <span className="text-primary font-bold">Lịch sử bài làm</span>
          </nav>
        </div>
      </LearnerHeader>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#181114] text-3xl font-black tracking-tight uppercase">Kết quả học tập</h1>
              <p className="text-[#886373] text-lg font-medium">Theo dõi sự tiến bộ và hành trình chinh phục JLPT của bạn.</p>
            </div>

            {/* Filter Group */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#f4f0f2] shadow-sm hover:border-primary/30 transition-all group cursor-pointer">
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">filter_list</span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-[#bcaab2] leading-none tracking-wider">Sắp xếp</span>
                  <select className="bg-transparent border-none text-xs font-bold text-[#181114] focus:ring-0 cursor-pointer p-0 pr-6 outline-none appearance-none uppercase">
                    <option>Ngày gần nhất</option>
                    <option>Điểm cao nhất</option>
                    <option>Thời gian làm bài</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#f4f0f2] shadow-sm hover:border-primary/30 transition-all group cursor-pointer">
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">calendar_today</span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-[#bcaab2] leading-none tracking-wider">Thời gian</span>
                  <select className="bg-transparent border-none text-xs font-bold text-[#181114] focus:ring-0 cursor-pointer p-0 pr-6 outline-none appearance-none uppercase">
                    <option>Tất cả</option>
                    <option>Tháng này</option>
                    <option>7 ngày qua</option>
                    <option>Tùy chọn</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon="quiz" label="Tổng bài đã làm" value="24" iconColorClass="text-primary" bgColorClass="bg-primary/10" />
            <StatCard icon="trending_up" label="Điểm trung bình" value="82%" iconColorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
            <StatCard icon="timer" label="Tổng thời gian" value="12.5 giờ" iconColorClass="text-amber-600" bgColorClass="bg-amber-50" />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-[#f4f0f2] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9fa] border-b border-[#f4f0f2]">
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">Ngày thực hiện</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">Tên bài kiểm tra</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">Điểm đạt được</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em]">Thời gian</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-[#886373] uppercase tracking-[0.2em] text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f0f2]">
                  <ExamRow date="24 Tháng 10, 2023" time="14:20 PM" level="N3" title="Đề thi thử N3 Full Mock #4" score={88} duration="45:12 phút" scoreColor="bg-emerald-500" />
                  <ExamRow date="22 Tháng 10, 2023" time="09:15 AM" level="N4" title="Trọng tâm Ngữ pháp: Trợ từ" score={72} duration="12:30 phút" scoreColor="bg-primary" />
                  <ExamRow date="20 Tháng 10, 2023" time="18:45 PM" level="N3" title="Thành thạo Kanji Level 3" score={95} duration="08:15 phút" scoreColor="bg-emerald-500" />
                  <ExamRow date="15 Tháng 10, 2023" time="11:00 AM" level="N3" title="Đọc hiểu tổng hợp B" score={64} duration="28:40 phút" scoreColor="bg-amber-500" />
                  <ExamRow date="12 Tháng 10, 2023" time="15:30 PM" level="N3" title="Nghe hiểu: Đời sống hàng ngày" score={82} duration="15:00 phút" scoreColor="bg-emerald-500" />
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 bg-[#fbf9fa] flex items-center justify-between border-t border-[#f4f0f2]">
              <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">Hiển thị 5 trong số 24 bài làm</p>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-xl border border-[#f4f0f2] bg-white text-xs font-bold text-[#886373] hover:bg-white hover:shadow-sm transition-all active:scale-95">Trước</button>
                <button className="px-5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95">Sau</button>
              </div>
            </div>
          </div>

          {/* AI Insight Box */}
          <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="size-20 rounded-3xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-primary/10">
              <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-[#181114] text-lg font-black uppercase tracking-tight">AI Tutor Nhận xét</h3>
              <p className="text-sm text-[#886373] mt-2 leading-relaxed">
                Dựa trên lịch sử làm bài, bạn thường ghi điểm <span className="text-primary font-bold">cao hơn 15%</span> ở phần Từ vựng so với Ngữ pháp. Chúng tôi khuyên bạn nên dành 3 phiên học tới để luyện tập các mẫu Ngữ pháp N3 để cân bằng hồ sơ kỹ năng của mình.
              </p>
            </div>
            <button className="whitespace-nowrap px-8 py-3 bg-primary text-white text-sm font-bold rounded-full shadow-lg hover:shadow-primary/30 transition-all active:scale-95 uppercase tracking-wider">
              Bắt đầu luyện tập
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamHistory;