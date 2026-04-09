import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './LearnerSidebar';

const LearnerLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header sẽ được render từ trang con bằng component LearnerHeader */}
        <div className="flex-1 overflow-y-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default LearnerLayout;