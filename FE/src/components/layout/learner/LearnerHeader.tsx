import React from 'react';

interface LearnerHeaderProps {
  title?: string;
  children?: React.ReactNode; 
}

const LearnerHeader: React.FC<LearnerHeaderProps> = ({ title, children }) => {
  return (
    <header className="h-20 bg-white border-b border-[#f4f0f2] flex items-center justify-between px-8 z-10 shrink-0">
      
      {/* KHU VỰC BÊN TRÁI: Nếu có children thì hiển thị children, không thì hiện title mặc định */}
      <div className="flex items-center gap-4">
        {children ? (
          children 
        ) : (
          <h2 className="text-xl font-bold text-[#181114] uppercase tracking-tight">{title || 'Learner Dashboard'}</h2>
        )}
      </div>

      {/* KHU VỰC BÊN PHẢI: Các nút hệ thống cố định */}
      <div className="flex items-center gap-6">
        <div className="h-8 w-px bg-[#f4f0f2] hidden md:block"></div>
        <div className="flex items-center gap-3">
          <button className="size-10 rounded-full bg-[#f4f0f2] flex items-center justify-center text-[#181114] relative hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full"></span>
          </button>
          <button className="size-10 rounded-full bg-[#f4f0f2] flex items-center justify-center text-[#181114] hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default LearnerHeader;