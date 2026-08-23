import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, isUserAdmin } from '../../context/AuthContext';
import logoNivora from '../../assets/logo-nivora.jpg';

// Google SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 380 },
  },
  exit: {
    opacity: 0, scale: 0.94, y: 16,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const LoginModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const { login, register, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const firstInputRef = useRef(null);

  // Sync tab when modal opens
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstInputRef.current?.focus(), 120);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Reset on tab switch
  useEffect(() => {
    setForm({ name: '', email: '', password: '', confirm: '' });
    setErrors({});
    setShowPassword(false);
  }, [tab]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm((p) => ({ ...p, email: 'alex@example.com', password: 'password123' }));
    else setForm((p) => ({ ...p, email: 'sarah@example.com', password: 'password123' }));
  };

  const validateLogin = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên là bắt buộc';
    if (!form.email) errs.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) errs.password = 'Tối thiểu 6 ký tự';
    if (form.password !== form.confirm) errs.confirm = 'Mật khẩu không khớp';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    const result = await login(form.email, form.password);
    if (result.success) {
      onClose();
      if (isUserAdmin(result.user)) {
        navigate('/admin');
      }
    } else if (result.error === 'NOT_VERIFIED') {
      onClose();
      navigate(`/verify?email=${encodeURIComponent(form.email)}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      onClose();
      if (result.user && !result.user.isActive) {
        navigate(`/verify?email=${encodeURIComponent(form.email)}`);
      }
    }
  };

  const handleGoogleLogin = () => {
    onClose();
    loginWithGoogle();
  };

  const FieldError = ({ name }) =>
    errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name]}</p> : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
            >
              <X size={16} />
            </button>

            <div className="p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src={logoNivora}
                  alt="NIVORA"
                  className="h-10 w-auto object-contain rounded-lg shadow-sm"
                />
              </div>

              {/* Tab switcher */}
              <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
                {['login', 'register'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      tab === t
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            ref={firstInputRef}
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-all ${
                              errors.email
                                ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                                : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <FieldError name="email" />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mật khẩu</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full pl-10 pr-10 py-3 text-sm border rounded-xl outline-none transition-all ${
                              errors.password
                                ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                                : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <FieldError name="password" />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input type="checkbox" className="rounded accent-emerald-600 w-4 h-4" />
                          Ghi nhớ đăng nhập
                        </label>
                        <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                          Quên mật khẩu?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 shine"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Đăng nhập <ArrowRight size={16} /></>
                        )}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">hoặc</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google button */}
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <GoogleIcon />
                      Đăng nhập với Google
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleRegister} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Họ và tên</label>
                        <input
                          ref={firstInputRef}
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Nguyễn Văn A"
                          className={`w-full px-4 py-3 text-sm border rounded-xl outline-none transition-all ${
                            errors.name
                              ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                              : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                          }`}
                        />
                        <FieldError name="name" />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-all ${
                              errors.email
                                ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                                : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <FieldError name="email" />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mật khẩu</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Tối thiểu 6 ký tự"
                            className={`w-full pl-10 pr-10 py-3 text-sm border rounded-xl outline-none transition-all ${
                              errors.password
                                ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                                : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <FieldError name="password" />
                      </div>

                      {/* Confirm */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Xác nhận mật khẩu</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            name="confirm"
                            type="password"
                            value={form.confirm}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu"
                            className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-all ${
                              errors.confirm
                                ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                                : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <FieldError name="confirm" />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 shine"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Tạo tài khoản <ArrowRight size={16} /></>
                        )}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">hoặc</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google button */}
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <GoogleIcon />
                      Đăng ký với Google
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
