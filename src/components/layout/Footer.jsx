import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import logoNivora from '../../assets/logo-nivora.jpg';

const footerLinks = {
  'Mua sắm': [
    { label: 'Tất cả sản phẩm', to: '/products' },
    { label: 'Hàng mới về', to: '/products?filter=new' },
    { label: 'Bán chạy nhất', to: '/products?filter=bestseller' },
    { label: 'Khuyến mãi', to: '/products?filter=sale' },
  ],
  'Hỗ trợ': [
    { label: 'Trung tâm trợ giúp', to: '#' },
    { label: 'Theo dõi đơn hàng', to: '#' },
    { label: 'Đổi trả hàng', to: '#' },
    { label: 'Liên hệ', to: '#' },
  ],
  'Về NIVORA': [
    { label: 'Về chúng tôi', to: '#' },
    { label: 'Tuyển dụng', to: '#' },
    { label: 'Báo chí', to: '#' },
    { label: 'Blog', to: '#' },
  ],
};

const SocialIcon = ({ label }) => {
  const icons = {
    Facebook: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    TikTok: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
    Instagram: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    YouTube: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  };
  return icons[label] || null;
};

const socialLinks = [
  { label: 'Facebook', href: '#' },
  { label: 'TikTok', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'YouTube', href: '#' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Đăng ký nhận tin thành công!');
    setEmail('');
  };

  return (
    <footer className="bg-gray-950 text-gray-300 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* Newsletter banner */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center justify-between gap-8"
          >
            <div>
              <h3 className="text-2xl font-black text-white mb-1">Nhận ưu đãi độc quyền</h3>
              <p className="text-gray-400 text-sm">Đăng ký để nhận thông tin bộ sưu tập mới và khuyến mãi đặc biệt.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:w-72 relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/50 flex-shrink-0 shine"
              >
                <Send size={15} /> Đăng ký
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Main footer */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand column */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Link to="/" className="inline-block mb-5 group">
              <img
                src={logoNivora}
                alt="NIVORA"
                className="h-10 w-auto object-contain rounded-xl opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Phong cách riêng, chất riêng bạn. NIVORA mang đến những thiết kế tinh tế và chất liệu cao cấp cho phong cách hiện đại.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              {[
                { icon: Mail, text: 'support@nivora.vn' },
                { icon: Phone, text: '+84 (0) 123 456 789' },
                { icon: MapPin, text: '123 Nguyễn Huệ, Q.1, TP.HCM' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-gray-400 hover:text-gray-300 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-emerald-500" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links], colIdx) => (
            <motion.div
              key={title}
              custom={colIdx + 1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                    >
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-500" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} NIVORA. Bảo lưu mọi quyền.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2.5">
            {socialLinks.map(({ label, href }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-colors duration-200"
              >
                <SocialIcon label={label} />
              </motion.a>
            ))}
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Chính sách bảo mật</a>
            <span className="text-gray-800">·</span>
            <a href="#" className="hover:text-gray-400 transition-colors">Điều khoản sử dụng</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
