import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const isLg = window.innerWidth >= 1024;
      setIsLargeScreen(isLg);
      if (isLg) setSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="admin-root min-h-screen bg-[#040b0a] text-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`flex flex-col flex-1 min-w-0 min-h-screen transition-all duration-300 ease-in-out ${
          isLargeScreen ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="relative flex-1 overflow-y-auto bg-gradient-to-b from-[#020806] via-[#06110f] to-[#040a08] px-0 py-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute right-10 top-32 hidden h-72 w-72 rounded-full bg-emerald-400/5 blur-3xl xl:block" />
          <div className="relative w-full overflow-hidden rounded-none border border-white/10 bg-[#08120f]/90 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.45)] p-6 sm:p-8 min-h-[calc(100vh-170px)]">
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#010704] via-transparent to-transparent opacity-70 pointer-events-none" />
            <div className="pointer-events-none absolute left-8 top-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute right-12 bottom-16 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
            <Outlet />
          </div>
        </main>

        <footer className="text-center py-4 mt-6 text-sm text-slate-300/70">
          © {new Date().getFullYear()} Veetu Rusi. Built for powerful platform control.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
