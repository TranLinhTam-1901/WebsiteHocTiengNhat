import React from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';

const ListeningManagement: React.FC = () => {
  // Dữ liệu mẫu
  const audioList = [
    { id: 1, title: 'Lunch Time Conversations', date: 'Oct 12, 2023', duration: '02:45', level: 'N5', category: 'Daily Life', levelColor: 'bg-blue-100 text-blue-600' },
    { id: 2, title: 'Project Proposal Meeting', date: 'Oct 10, 2023', duration: '05:12', level: 'N3', category: 'Business', levelColor: 'bg-red-100 text-red-600' },
    { id: 3, title: 'Asking for Station Directions', date: 'Oct 08, 2023', duration: '01:30', level: 'N5', category: 'Travel', levelColor: 'bg-blue-100 text-blue-600' },
    { id: 4, title: 'NHK News: Weather Update', date: 'Oct 05, 2023', duration: '02:10', level: 'N4', category: 'News', levelColor: 'bg-purple-100 text-purple-600' },
    { id: 5, title: 'Weekend Social Plans', date: 'Oct 01, 2023', duration: '03:20', level: 'N4', category: 'Social', levelColor: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="flex flex-col h-full bg-background-light">
      {/* --- Header Section --- */}
      <AdminHeader>
      <div className="flex items-center gap-194">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ BÀI NGHE</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề audio..."
              className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
            />
          </div>

          {/* Add Button */}
          <Link 
            to="/admin/resource/listening/create" // Thay đường dẫn này bằng route thực tế của bạn
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
          >
            <span className="material-symbols-outlined text-sm">cloud_upload</span>
            Thêm Bài nghe
          </Link>
        </div>

      </div>
      </AdminHeader>

      {/* --- Main Content --- */}
      <div className="flex-1 overflow-hidden p-3 space-y-3">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard 
            icon="data_usage" 
            title="Storage Usage" 
            value="1.2 GB" 
            subValue="of 5 GB" 
            progress={24} 
            iconColor="text-primary"
          />
          <StatCard 
            icon="query_stats" 
            title="Total Listens" 
            value="42,891" 
            trend="+8% from last month" 
            iconColor="text-blue-500"
          />
          <StatCard 
            icon="auto_fix_high" 
            title="AI Transcript Accuracy" 
            value="98.4%" 
            subValue="Verified by community" 
            iconColor="text-purple-500"
          />
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fbf9fa] border-b border-[#f4f0f2]">
                  <th className="px-6 py-4 text-xs font-bold text-[#886373] uppercase tracking-wider">Audio Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#886373] uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#886373] uppercase tracking-wider text-center">Level</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#886373] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#886373] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f0f2]">
                {audioList.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">graphic_eq</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#181114]">{item.title}</p>
                          <p className="text-[10px] text-[#886373]">Uploaded {item.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#181114]">{item.duration}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`${item.levelColor} px-3 py-1 rounded-full text-[10px] font-black uppercase`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#886373]">{item.category}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="size-8 rounded-full hover:bg-primary/10 text-primary transition-colors flex items-center justify-center" title="Play Preview">
                          <span className="material-symbols-outlined text-lg">play_circle</span>
                        </button>
                        <button className="size-8 rounded-full hover:bg-[#f4f0f2] text-[#886373] hover:text-primary transition-all border border-transparent hover:border-[#f4f0f2] flex items-center justify-center" title="Edit">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button className="size-8 rounded-full hover:bg-red-50 text-red-500 transition-colors flex items-center justify-center" title="Delete">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between">
            <p className="text-xs text-[#886373] font-medium">
              Showing <span className="text-[#181114]">5</span> of 128 audio files
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-bold rounded-xl border border-[#f4f0f2] text-[#886373] hover:bg-[#f4f0f2] transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white shadow-lg shadow-primary/10 active:scale-95 transition-transform">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component for Stats ---
const StatCard = ({ icon, title, value, subValue, trend, progress, iconColor }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      <h4 className="text-sm font-bold text-[#181114]">{title}</h4>
    </div>
    <div className="flex items-end justify-between mb-2">
      <p className="text-2xl font-black text-[#181114]">{value}</p>
      {subValue && <p className="text-xs text-[#886373]">{subValue}</p>}
    </div>
    {progress !== undefined && (
      <div className="h-1.5 w-full bg-[#f4f0f2] rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
      </div>
    )}
    {trend && (
      <p className="text-xs text-green-500 font-bold flex items-center gap-1 mt-2">
        <span className="material-symbols-outlined text-xs">trending_up</span> {trend}
      </p>
    )}
  </div>
);

export default ListeningManagement;