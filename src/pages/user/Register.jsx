import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
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
    if (form.password !== form.confirm) errs.confirm = 'Mật khẩu xác nhận không khớp';
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
    <div className="min-h-screen flex bg-[#fafbfd]">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-12 text-white relative">
        <div className="relative text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">{APP_NAME}</h2>
          <p className="text-slate-300 text-sm font-normal leading-relaxed">
            Tạo tài khoản để trải nghiệm mua sắm cá nhân hóa với công nghệ gợi ý AI.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-8">
            <h1 className="text-xl font-extrabold text-slate-900 mb-1 uppercase tracking-tight">Tạo tài khoản mới</h1>
            <p className="text-slate-500 text-xs mb-6">Đăng ký để nhận ưu đãi mua sắm cao cấp</p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                error={errors.name}
                icon={User}
                required
              />
              <Input
                label="Địa chỉ Email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                error={errors.email}
                icon={Mail}
                required
              />
              <div className="relative">
                <Input
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  error={errors.password}
                  icon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                error={errors.confirm}
                icon={Lock}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs mt-2 disabled:opacity-50"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-5">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  window.dispatchEvent(new Event('open-login-modal'));
                }}
                className="text-slate-900 font-bold hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
