import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileAbierto, setMobileAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileAbierto={mobileAbierto}
        setMobileAbierto={setMobileAbierto}
      />

      <div className={`pt-14 transition-all duration-300 ${collapsed ? 'md:ml-14' : 'md:ml-56'}`}>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
