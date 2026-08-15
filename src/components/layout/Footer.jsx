import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, ArrowRight, Send, 
  Truck, ShieldCheck, RefreshCw, Headset, 
  CheckCircle2, Lock, Sparkles, Heart 
} from 'lucide-react';
import toast from 'react-hot-toast';
import logoNivora from '../../assets/logo-nivora.jpg';

const trustFeatures = [
  {
    icon: Truck,
    title: 'Giao hàng hỏa tốc',
    desc: 'Miễn phí giao hàng cho đơn từ 500k',
  },
  {
    icon: ShieldCheck,
    title: '100% Chính hãng',
    desc: 'Cam kết chất lượng & chuẩn nguồn gốc',
  },
  {
    icon: RefreshCw,
    title: '30 Ngày đổi trả',
    desc: 'Đổi trả tận nơi nhanh chóng, miễn phí',
  },
  {
    icon: Headset,
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ tư vấn tận tâm & chuyên nghiệp',
  },
];

const footerNavs = {
  'Danh Mục Nổi Bật': [
    { label: 'Tất cả sản phẩm', to: '/products' },
    { label: 'Sản phẩm mới về', to: '/products?filter=new' },
    { label: 'Sản phẩm bán chạy', to: '/products?filter=bestseller' },
    { label: 'Khuyến mãi đặc biệt', to: '/products?filter=sale' },
  ],
  'Hỗ Trợ Khách Hàng': [
    { label: 'Trung tâm trợ giúp (FAQ)', to: '#' },
    { label: 'Hướng dẫn mua hàng', to: '#' },
    { label: 'Chính sách bảo hành', to: '#' },
    { label: 'Quy định đổi trả & hoàn tiền', to: '#' },
  ],
  'Về NIVORA': [
    { label: 'Câu chuyện thương hiệu', to: '#' },
    { label: 'Tuyển dụng nhân tài', to: '#' },
    { label: 'Hệ thống showroom', to: '#' },
    { label: 'Tin tức & Blog thiết kế', to: '#' },
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
  { label: 'Facebook', href: '#', hoverClass: 'hover:bg-blue-600 hover:border-blue-500' },
  { label: 'TikTok', href: '#', hoverClass: 'hover:bg-pink-600 hover:border-pink-500' },
  { label: 'Instagram', href: '#', hoverClass: 'hover:bg-amber-600 hover:border-amber-500' },
  { label: 'YouTube', href: '#', hoverClass: 'hover:bg-red-600 hover:border-red-500' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
  }),
};

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('🎉 Đăng ký nhận bản tin thành công!');
    setEmail('');
  };

  return (
    <footer className="bg-slate-950 text-slate-300 relative overflow-hidden font-sans border-t border-slate-800/80">
      
      {/* ── Ambient Glow Backdrops ── */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── 1. Trust Features Banner (4 Pillars) ── */}
      <div className="relative border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustFeatures.map((item, index) => {
              const IconComp = item.icon;
              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -2 }}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all duration-300 flex items-center gap-3.5 shadow-sm group"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <IconComp size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 mb-0.5 group-hover:text-emerald-300 transition-colors">{item.title}</h5>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Newsletter Banner Card ── */}
      <div className="relative border-b border-slate-800/60">
        <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950/80 border border-emerald-500/20 rounded-3xl p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden"
          >
            {/* Shimmer decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1.5 text-center lg:text-left z-10 max-w-xl">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Đăng Ký Nhận Bản Tin Ưu Đãi
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Cập nhật xu hướng thời trang & nội thất mới nhất cùng các chương trình khuyến mãi đặc biệt từ NIVORA.
              </p>
            </div>

            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto z-10 shrink-0">
              <div className="relative flex-1 lg:w-80">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn..."
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl text-xs font-medium text-slate-100 placeholder-slate-500 outline-none ring-2 ring-transparent focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 cursor-pointer shrink-0"
              >
                <Send size={14} /> Đăng ký ngay
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── 3. Main Footer Columns ── */}
      <div className="relative max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand Info (takes 2 columns) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-6"
          >
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src={logoNivora}
                alt="NIVORA"
                className="h-11 w-auto object-contain rounded-2xl ring-2 ring-emerald-500/30 group-hover:ring-emerald-400 transition-all duration-300"
              />
              <div>
                <span className="text-2xl font-black text-white tracking-wide block group-hover:text-emerald-400 transition-colors">
                  NIVORA
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  Modern Lifestyle Brand
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              NIVORA mang đến không gian sống & phong cách thời trang hiện đại với các sản phẩm thiết kế tinh tế, chất lượng cao cấp cùng trải nghiệm mua sắm thông minh được hỗ trợ bởi trí tuệ nhân tạo.
            </p>

            {/* Contact Details */}
            <div className="space-y-3.5 pt-2">
              {[
                { icon: Mail, text: 'support@nivora.vn', label: 'Email chăm sóc khách hàng' },
                { icon: Phone, text: '1900 6868 (8:00 - 21:00)', label: 'Hotline tư vấn miễn phí' },
                { icon: MapPin, text: '84C Đường Nguyễn Thanh Bình, Phường Mộ Lao, Quận Hà Đông, Hà Nội', label: 'Showroom chính' },
              ].map(({ icon: Icon, text, label }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-slate-400 group">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
                    <Icon size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{label}</span>
                    <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Navigation Links Columns (3 columns) */}
          {Object.entries(footerNavs).map(([title, links], colIdx) => (
            <motion.div
              key={title}
              custom={colIdx + 1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="text-white font-bold text-xs uppercase tracking-wider border-l-2 border-emerald-500 pl-3">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-all flex items-center gap-1.5 group"
                    >
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-emerald-400 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

        </div>

        {/* ── 4. Bottom Footer Bar ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Copyright */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} NIVORA Inc. Bảo lưu mọi quyền.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
              Thiết kế bởi <Heart size={12} className="text-emerald-500 fill-emerald-500 animate-pulse" /> Nivora Team
            </span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, hoverClass }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white ${hoverClass} transition-all duration-200 shadow-sm`}
              >
                <SocialIcon label={label} />
              </motion.a>
            ))}
          </div>

          {/* Security & Legal */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              <Lock size={12} className="text-emerald-400" /> SSL 256-bit Encrypted
            </span>
            <a href="#" className="hover:text-slate-300 transition-colors">Bảo mật</a>
            <span className="text-slate-800">•</span>
            <a href="#" className="hover:text-slate-300 transition-colors">Điều khoản</a>
          </div>
        </motion.div>
      </div>

    </footer>
  );
};

export default Footer;
