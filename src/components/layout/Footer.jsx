import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, ArrowRight, Send, 
  Truck, ShieldCheck, RefreshCw, Headset, 
  Lock, Heart 
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
    { label: 'Tin tức & Blog', to: '#' },
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

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Đăng ký nhận bản tin thành công!');
    setEmail('');
  };

  return (
    <footer className="bg-slate-900 text-slate-300 relative font-sans border-t border-slate-800">
      {/* 1. Trust Features Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trustFeatures.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-100 shrink-0">
                    <IconComp size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100 mb-0.5">{item.title}</h5>
                    <p className="text-[11px] text-slate-400 font-normal">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Newsletter Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 py-8">
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center lg:text-left">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Đăng ký nhận ưu đãi mới nhất
              </h3>
              <p className="text-xs text-slate-400">
                Nhận tin tức sản phẩm mới và các chương trình khuyến mãi đặc quyền từ NIVORA.
              </p>
            </div>

            <form onSubmit={handleNewsletter} className="flex gap-2 w-full lg:w-auto shrink-0">
              <div className="relative flex-1 lg:w-72">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-normal text-slate-100 placeholder-slate-500 outline-none focus:border-slate-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send size={13} /> Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Footer Links */}
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={logoNivora}
                alt="NIVORA"
                className="h-9 w-auto object-contain rounded-lg border border-slate-700"
              />
              <span className="text-xl font-extrabold text-white tracking-wide">
                NIVORA
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              NIVORA mang đến các sản phẩm mua sắm phong cách sống & thiết kế hiện đại, chất lượng cao cùng trải nghiệm mua sắm đa dạng, tiện lợi.
            </p>

            <div className="space-y-2 pt-1">
              {[
                { icon: Mail, text: 'support@nivora.vn' },
                { icon: Phone, text: '1900 6868 (8:00 - 21:00)' },
                { icon: MapPin, text: '84C Đường Nguyễn Thanh Bình, Mộ Lao, Hà Đông, Hà Nội' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Icon size={14} className="text-slate-400 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {Object.entries(footerNavs).map(([title, links]) => (
            <div key={title} className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-slate-400 hover:text-white font-normal transition-colors block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 4. Bottom Legal */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} NIVORA Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-2">
            {socialLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <SocialIcon label={label} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Lock size={12} className="text-slate-400" /> SSL Encrypted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
