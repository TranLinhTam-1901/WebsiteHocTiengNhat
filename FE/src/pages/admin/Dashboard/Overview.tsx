import React from 'react';

const DashboardIndex: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="group" label="Tổng học viên" value="12,842" trend="+12%" color="blue" />
        <StatCard icon="bolt" label="Phiên đang hoạt động" value="1,432" trend="+5%" color="purple" />
        <StatCard icon="verified" label="Tỷ lệ đỗ trung bình" value="76,4%" trend="-2%" color="primary" isPrimary />
        <StatCard icon="psychology" label="Hiệu suất AI" value="94/100" trend="Cao" color="amber" />
      </div>

      {/* Activity Chart Section */}
      <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold">Xu hướng hoạt động học viên</h3>
            <p className="text-sm text-[#886373]">Khối lượng phiên học theo tuần, mọi cấp độ</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-xs font-bold rounded-full bg-primary text-white shadow-md shadow-primary/20">Phiên học</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-full bg-[#f4f0f2] text-[#886373]">Người mới</button>
          </div>
        </div>
        <div className="relative h-64 w-full flex items-end justify-between gap-4 px-4 py-2 border-b border-[#f4f0f2]" style={{ background: 'linear-gradient(180deg, rgba(242, 133, 173, 0.1) 0%, rgba(242, 133, 173, 0) 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
              <path className="text-primary" d="M0,80 Q100,20 200,60 T400,30 T600,70 T800,20 T1000,50" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          {[40, 65, 55, 85, 60, 45, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group z-10">
              <div className={`w-full ${h === 85 ? 'bg-primary' : 'bg-primary/20'} rounded-t-lg transition-all group-hover:bg-primary/40`} style={{ height: `${h}%` }}></div>
              <span className="text-[10px] font-bold text-[#886373] uppercase">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#f4f0f2] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#f4f0f2] flex items-center justify-between">
            <h3 className="font-bold">Câu sai nhiều nhất</h3>
            <button className="text-primary text-sm font-bold hover:underline">Xem tất cả</button>
          </div>
          <div className="divide-y divide-[#f4f0f2]">
            <QuestionItem level="N3" text="「経済」の読み方は何ですか。" color="bg-red-100 text-red-600" stats="42% tỷ lệ sai • Hán tự" />
            <QuestionItem level="N4" text="毎朝、公園を散歩____ことにしています。" color="bg-purple-100 text-purple-600" stats="38% tỷ lệ sai • Ngữ pháp" />
            <QuestionItem level="N5" text="明日、いっしょに映画を____ませんか。" color="bg-blue-100 text-blue-600" stats="35% tỷ lệ sai • Ngữ pháp" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#f4f0f2] p-6 shadow-sm">
          <h3 className="font-bold mb-6">Sức khỏe hệ thống</h3>
          <div className="space-y-6">
            <HealthItem label="Độ trễ API" status="Tối ưu" value="95%" color="bg-green-500" statusColor="text-green-500" />
            <HealthItem label="Trạng thái mô hình AI" status="Tải cao" value="78%" color="bg-primary" statusColor="text-primary" />
            <HealthItem label="Nhất quán CSDL" status="Ổn định" value="99%" color="bg-green-500" statusColor="text-green-500" />
            <div className="pt-4 mt-4 border-t border-[#f4f0f2]">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase">Gợi ý AI</p>
                  <p className="text-xs text-[#886373]">Mở rộng máy chủ cho tải N3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components (có thể tách file nếu muốn) ---

const StatCard = ({ icon, label, value, trend, color, isPrimary }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-500',
    purple: 'bg-purple-50 text-purple-500',
    amber: 'bg-amber-50 text-amber-500',
    primary: 'bg-primary/10 text-primary'
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-xs font-bold flex items-center ${trend.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
          {trend} {trend !== 'Cao' && <span className="material-symbols-outlined text-xs">trending_{trend.includes('+') ? 'up' : 'down'}</span>}
        </span>
      </div>
      <p className="text-sm font-medium text-[#886373]">{label}</p>
      <h3 className={`text-2xl font-black mt-1 ${isPrimary ? 'text-primary' : ''}`}>{value}</h3>
    </div>
  );
};

const QuestionItem = ({ level, text, color, stats }: any) => (
  <div className="p-4 flex items-center gap-4 hover:bg-primary/5 transition-colors cursor-pointer">
    <div className={`${color} px-2 py-1 rounded text-[10px] font-bold`}>{level}</div>
    <div className="flex-1">
      <p className="text-sm font-medium line-clamp-1">{text}</p>
      <p className="text-[10px] text-[#886373]">{stats}</p>
    </div>
    <span className="material-symbols-outlined text-[#886373]">arrow_forward_ios</span>
  </div>
);

const HealthItem = ({ label, status, value, color, statusColor }: any) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center text-xs">
      <span className="font-bold text-[#886373]">{label}</span>
      <span className={`font-bold ${statusColor}`}>{status}</span>
    </div>
    <div className="h-2 bg-[#f4f0f2] rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: value }}></div>
    </div>
  </div>
);

export default DashboardIndex;