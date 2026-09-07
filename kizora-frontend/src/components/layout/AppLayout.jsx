import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopNav } from './TopNav';

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-kz-bg text-kz-text">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col pb-16 md:pb-0">
        <TopNav />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
