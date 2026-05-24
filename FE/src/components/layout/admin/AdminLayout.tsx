import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet /> {/* Header sẽ được render từ trang con vào đây */}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;