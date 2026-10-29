import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Vertical Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Route Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
