import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
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
      navigate('/');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const result = await resendCode(email);
    if (result.success) {
      setCooldown(60); // 60s cooldown
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <ShieldCheck size={36} />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-gray-900 mb-2">Xác thực tài khoản</h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Chúng tôi đã gửi mã kích hoạt gồm 8 chữ số đến email: <br />
            <span className="font-semibold text-gray-800 break-all">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nhập mã xác nhận (8 chữ số)"
              placeholder="12345678"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').substring(0, 8));
                if (error) setError('');
              }}
              error={error}
              icon={Mail}
              className="text-center tracking-[0.2em] font-mono text-lg"
              required
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              <span className="flex items-center justify-center gap-2">
                Kích hoạt tài khoản <ArrowRight size={18} />
              </span>
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Không nhận được mã?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className={`font-semibold transition-all inline-flex items-center gap-1 ${
                  cooldown > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                <RefreshCw size={14} className={cooldown > 0 ? '' : 'animate-spin-slow'} />
                {cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : 'Gửi lại mã'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Verify;
