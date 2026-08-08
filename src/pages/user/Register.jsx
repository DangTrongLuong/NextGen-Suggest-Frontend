import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Package } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Họ tên là bắt buộc';
    else if (form.name.trim().length < 2) errs.name = 'Họ tên phải có ít nhất 2 ký tự';
    if (!form.email.trim()) errs.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Mật khẩu cần ít nhất 1 chữ hoa';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Mật khẩu cần ít nhất 1 chữ thường';
    else if (!/\d/.test(form.password)) errs.password = 'Mật khẩu cần ít nhất 1 số';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errs.password = 'Mật khẩu cần ít nhất 1 ký tự đặc biệt';
    if (form.password !== form.confirm) errs.confirm = 'Mật khẩu không khớp';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      if (result.user && !result.user.isActive) {
        navigate(`/verify?email=${encodeURIComponent(form.email)}`);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Join {APP_NAME}</h2>
          <p className="text-emerald-100 text-lg max-w-sm">
            Create your account and start exploring thousands of premium products.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['10K+', 'Products'], ['50K+', 'Members'], ['4.9★', 'Rating']].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-black text-white">{v}</p>
                <p className="text-emerald-200 text-xs">{l}</p>
              </div>
            ))}
          </div>
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
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-1">Create account</h1>
            <p className="text-gray-500 text-sm mb-8">Join thousands of happy customers</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                error={errors.name}
                icon={User}
                required
              />
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
                  placeholder="Min. 6 characters"
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
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                error={errors.confirm}
                icon={Lock}
                required
              />

              <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 rounded accent-emerald-600" />
                <span>
                  I agree to the{' '}
                  <button type="button" className="text-emerald-600 font-medium">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" className="text-emerald-600 font-medium">Privacy Policy</button>
                </span>
              </label>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  window.dispatchEvent(new Event('open-login-modal'));
                }}
                className="text-emerald-600 font-semibold hover:text-emerald-700"
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
