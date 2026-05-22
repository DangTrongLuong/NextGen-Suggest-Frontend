import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Package } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin' : from, { replace: true });
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'alex@example.com', password: 'password123' });
    else setForm({ email: 'sarah@example.com', password: 'password123' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">{APP_NAME}</h2>
          <p className="text-gray-300 text-lg max-w-sm">
            Premium products, curated for modern living. Sign in to continue your journey.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            {/* Logo (mobile) */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

            {/* Demo Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => fillDemo('user')}
                className="flex-1 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Demo User
              </button>
              <button
                onClick={() => fillDemo('admin')}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Demo Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                error={errors.email}
                icon={Mail}
                required
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  error={errors.password}
                  icon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded accent-emerald-600" />
                  Remember me
                </label>
                <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
