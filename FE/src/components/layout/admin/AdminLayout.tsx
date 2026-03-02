import React from 'react';
import { Outlet } from 'react-router-dom'; // Thêm dòng này
import Sidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden font-display bg-background-light text-[#181114]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-[#f4f0f2] flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-bold">Admin Overview</h2>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">search</span>
              <input 
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none" 
                placeholder="Search analytics..." 
                type="text" 
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="size-10 rounded-full bg-[#f4f0f2] flex items-center justify-center relative hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full"></span>
              </button>
              <button className="size-10 rounded-full bg-[#f4f0f2] flex items-center justify-center hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-0 animate-in fade-in duration-500">
          <Outlet /> {/* Router sẽ tự đổ nội dung DashboardIndex vào đây */}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;