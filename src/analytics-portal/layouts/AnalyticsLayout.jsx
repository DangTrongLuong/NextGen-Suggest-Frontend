import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, BarChart3, Clock, Database, LogOut, 
  Terminal, ShieldAlert, Wifi, WifiOff, Menu, X 
} from 'lucide-react';
import { useAnalyticsStore } from '../store/store';
import { useWebSocket } from '../hooks/useWebSocket';

const AnalyticsLayout = () => {
  const { user, loading, isConnected, alerts, logoutUser, initializeAuth, addAlert } = useAnalyticsStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Run initial session check on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Connect WebSocket and listen for realtime events
  useWebSocket((message) => {
    if (message.type === 'NEW_SEARCH') {
      // We can trigger state changes here or log to console
      console.log('Realtime search log received:', message.data);
    }
  });

  const handleLogout = async () => {
    await logoutUser();
    navigate('/analytics-portal/login');
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
          <Activity className="absolute text-emerald-500 animate-pulse" size={24} />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-wider text-slate-400">ĐANG KHỞI TẠO HỆ THỐNG GIÁM SÁT...</p>
      </div>
    );
  }

  // 2. Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/analytics-portal/login" state={{ from: location }} replace />;
  }

  const navLinks = [
    { label: 'Bảng điều khiển', to: '/analytics-portal', icon: BarChart3, end: true },
    { label: 'Lịch sử tìm kiếm', to: '/analytics-portal/history', icon: Clock },
    { label: 'Top sản phẩm', to: '/analytics-portal/top-products', icon: Database },
    { label: 'Trạng thái hệ thống', to: '/analytics-portal/health', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans flex overflow-hidden">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col flex-shrink-0 z-10">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <Terminal className="text-emerald-500" size={22} />
          <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            NIVORA MONITOR
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-glow-sm' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100 border border-transparent'}
                `}
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-4">
          {/* Connection status card */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-semibold">Realtime Feed</span>
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">ONLINE</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-xs text-rose-500 font-bold">OFFLINE</span>
                </>
              )}
            </div>
          </div>

          {/* User profile & logout */}
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-200 truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{user.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background glow orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] rounded-full bg-teal-950/10 blur-[100px] pointer-events-none"></div>

        {/* Global header bar */}
        <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-8 z-10 bg-slate-950/20 backdrop-blur-sm flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-200">
            {location.pathname === '/analytics-portal' && 'Bảng giám sát tìm kiếm'}
            {location.pathname === '/analytics-portal/history' && 'Lịch sử yêu cầu tìm kiếm'}
            {location.pathname === '/analytics-portal/top-products' && 'Phân tích Top sản phẩm'}
            {location.pathname === '/analytics-portal/health' && 'Trạng thái hoạt động hệ thống'}
          </h1>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>Phiên hoạt động: 8h</span>
            <span className="h-4 w-px bg-slate-800"></span>
            <span>IP của bạn: {user.ip_address}</span>
          </div>
        </header>

        {/* Page content view port */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          {/* Active Alerts Banner list */}
          {alerts && alerts.length > 0 && (
            <div className="mb-8 space-y-2">
              {alerts.slice(0, 3).map((alert, i) => (
                <div 
                  key={i} 
                  className={`flex items-start justify-between p-4 rounded-xl border animate-pulse-glow ${
                    alert.severity === 'critical' 
                      ? 'bg-rose-950/20 border-rose-900/60 text-rose-300' 
                      : 'bg-amber-950/20 border-amber-900/60 text-amber-300'
                  }`}
                >
                  <div className="flex gap-3">
                    <ShieldAlert size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Cảnh báo hệ thống ({alert.metric})</p>
                      <p className="text-sm mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] opacity-60 font-semibold">{new Date(alert.triggered_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
          
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AnalyticsLayout;
