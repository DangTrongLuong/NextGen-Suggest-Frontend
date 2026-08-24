import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth, isUserAdmin } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { verify, resendCode, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      toast.error('Không tìm thấy thông tin email xác thực.');
      navigate('/');
      window.dispatchEvent(new Event('open-login-modal'));
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setError('Mã xác nhận là bắt buộc');
      return;
    }
    if (!/^\d{8}$/.test(code)) {
      setError('Mã xác nhận phải là dãy 8 chữ số');
      return;
    }
    setError('');
    const result = await verify(email, code);
    if (result.success) {
      navigate(isUserAdmin(result.user) ? '/admin' : '/');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const result = await resendCode(email);
    if (result.success) {
      setCooldown(60);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafbfd]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900">
              <ShieldCheck size={24} />
            </div>
          </div>

          <h1 className="text-xl font-extrabold text-center text-slate-900 mb-1 uppercase tracking-tight">Xác thực tài khoản</h1>
          <p className="text-center text-slate-500 text-xs mb-6">
            Mã kích hoạt 8 chữ số đã được gửi đến email: <br />
            <span className="font-bold text-slate-900 break-all">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Mã xác nhận (8 chữ số)"
              placeholder="12345678"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').substring(0, 8));
                if (error) setError('');
              }}
              error={error}
              icon={Mail}
              className="text-center tracking-[0.2em] font-mono text-base"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? 'Đang kích hoạt...' : 'Kích hoạt ngay'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              Chưa nhận được mã?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className={`font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                  cooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-900 hover:underline'
                }`}
              >
                <RefreshCw size={13} />
                {cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại mã'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Verify;
