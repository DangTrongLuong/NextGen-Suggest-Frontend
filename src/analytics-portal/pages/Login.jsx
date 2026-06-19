import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Terminal, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAnalyticsStore } from '../store/store';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { user, loginUser, loading, initializeAuth } = useAnalyticsStore();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect path after logging in
  const from = location.state?.from?.pathname || '/analytics-portal';

  // Check session on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // If already logged in, redirect directly
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    const res = await loginUser(username.trim(), password);
    if (res.success) {
      toast.success('Đăng nhập cổng giám sát thành công.');
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center relative px-4 overflow-hidden font-sans">
      {/* Decorative colored glow circles */}
      <div className="absolute top-[20%] left-[25%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[25%] w-[450px] h-[450px] rounded-full bg-teal-500/10 blur-[150px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        
        {/* Portal Title & Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-glow-sm mb-4">
            <Terminal className="text-emerald-500" size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-slate-100">CỔNG GIÁM SÁT NỘI BỘ</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Hệ thống phân tích hoạt động tìm kiếm</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-card relative overflow-hidden">
          {/* Subtle line decoration on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-emerald-500" size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Xác thực quyền truy cập</span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 flex gap-2.5 items-start p-4 bg-rose-950/20 border border-rose-900/60 rounded-xl text-rose-300 text-sm animate-pulse-glow">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tên đăng nhập hoặc Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản giám sát..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-white text-sm font-bold rounded-xl shadow-glow-emerald hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ĐANG XÁC THỰC...
                </>
              ) : (
                'ĐĂNG NHẬP HỆ THỐNG'
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-6">
          HỆ THỐNG GIÁM SÁT NỘI BỘ • TRUY CẬP TRÁI PHÉP BỊ NGHIÊM CẤM
        </p>
      </div>
    </div>
  );
};

export default Login;
