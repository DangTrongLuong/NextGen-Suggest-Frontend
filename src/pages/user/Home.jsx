import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones,
  Star, TrendingUp, Sparkles, ChevronDown, MapPin, Users,
  Zap, Tag, Flame, Eye, ChevronLeft, ChevronRight, Gift,
  UserCheck, Shirt, ShoppingBag
} from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import { CardSkeleton } from '../../components/common/Loading';
import LoginModal from '../../components/common/LoginModal';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import api from '../../services/api';
import heroBg from '../../assets/background-2.png';

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};
const staggerText = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const textLine = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Static data ─────────────────────────────────────────────────────────────
const perks = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 500.000đ', color: 'emerald' },
  { icon: ShieldCheck, title: 'Thanh toán an toàn', desc: 'Bảo mật 100%', color: 'blue' },
  { icon: RotateCcw, title: 'Đổi trả dễ dàng', desc: 'Trong vòng 30 ngày', color: 'violet' },
  { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng hỗ trợ', color: 'amber' },
];

const perkColors = {
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
};

// Context-based recommendation tags (static, no backend needed)
const contextualTags = [
  { label: 'Phổ biến tại Hà Nội', icon: MapPin, color: 'bg-red-50 text-red-600 border-red-100', filter: 'hanoi' },
  { label: 'Phổ biến tại TP. HCM', icon: MapPin, color: 'bg-orange-50 text-orange-600 border-orange-100', filter: 'hcm' },
  { label: 'Xu hướng dành cho nam', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100', filter: 'male' },
  { label: 'Xu hướng dành cho nữ', icon: Users, color: 'bg-pink-50 text-pink-600 border-pink-100', filter: 'female' },
  { label: 'Khuyến mãi hot nhất', icon: Flame, color: 'bg-rose-50 text-rose-600 border-rose-100', filter: 'promo' },
  { label: 'Xem nhiều nhất', icon: Eye, color: 'bg-purple-50 text-purple-600 border-purple-100', filter: 'popular' },
];

// Promotion banners (static)
const promotions = [
  {
    id: 1,
    title: 'FLASH SALE',
    subtitle: 'Giảm đến 50%',
    desc: 'Chỉ trong hôm nay — số lượng có hạn',
    tag: '⚡ Kết thúc sau 6 giờ',
    gradient: 'from-rose-600 via-red-600 to-orange-500',
    link: '/products',
    emoji: '🔥',
  },
  {
    id: 2,
    title: 'HÀNG MỚI VỀ',
    subtitle: 'Bộ sưu tập hè 2025',
    desc: 'Phong cách trẻ trung, năng động — cập nhật liên tục',
    tag: '✨ Cập nhật hàng tuần',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    link: '/products?filter=new',
    emoji: '🌿',
  },
  {
    id: 3,
    title: 'ĐẶC BIỆT',
    subtitle: 'Mua 2 tặng 1',
    desc: 'Áp dụng cho toàn bộ sản phẩm phụ kiện & thời trang',
    tag: '🎁 Áp dụng tự động',
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    link: '/products',
    emoji: '💜',
  },
];

// Gender trend sections (static labels)
const genderTrends = [
  {
    key: 'male',
    label: 'Xu hướng dành cho Nam',
    Icon: Shirt,
    desc: 'Phong cách lịch lãm, năng động cho phái mạnh',
    gradient: 'from-slate-800 to-blue-900',
    accent: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
    badgeColor: 'bg-blue-500/30 text-blue-100',
    tags: ['Áo polo', 'Quần chino', 'Giày sneaker', 'Áo khoác'],
  },
  {
    key: 'female',
    label: 'Xu hướng dành cho Nữ',
    Icon: ShoppingBag,
    desc: 'Thanh lịch, hiện đại và đầy cá tính riêng',
    gradient: 'from-rose-700 to-pink-800',
    accent: 'bg-rose-400/20 text-rose-100 border-rose-300/30',
    badgeColor: 'bg-rose-400/30 text-rose-100',
    tags: ['Váy hoa', 'Áo croptop', 'Túi xách', 'Sandal'],
  },
];

// Regional popular sections
const regionalSections = [
  {
    key: 'hanoi',
    city: 'Hà Nội',
    emoji: '🏛️',
    desc: 'Xu hướng tại thủ đô',
    color: 'from-rose-600 to-red-700',
  },
  {
    key: 'hcm',
    city: 'TP. Hồ Chí Minh',
    emoji: '🌆',
    desc: 'Thịnh hành tại thành phố năng động',
    color: 'from-amber-500 to-orange-600',
  },
];

// ─── Components ──────────────────────────────────────────────────────────────
const ProductRowSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
    {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

const SectionHeader = ({ badge, badgeIcon: Icon, title, viewAll, viewAllHref }) => (
  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
    className="flex items-end justify-between mb-10">
    <div>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={15} className="text-emerald-600" />}
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{badge}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">{title}</h2>
    </div>
    {viewAll && (
      <Link to={viewAllHref || '/products'}
        className="hidden sm:flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group shrink-0 ml-4">
        Xem tất cả <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    )}
  </motion.div>
);

// ─── Promotion Banner Carousel ────────────────────────────────────────────────
const PromoBannerCarousel = () => {
  const [idx, setIdx] = useState(0);
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    if (!isAuto) return;
    const t = setInterval(() => setIdx(i => (i + 1) % promotions.length), 4500);
    return () => clearInterval(t);
  }, [isAuto]);

  const go = (dir) => {
    setIsAuto(false);
    setIdx(i => (i + dir + promotions.length) % promotions.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[280px] sm:h-[340px]">
      <AnimatePresence mode="wait">
        {promotions.map((p, i) => i === idx && (
          <motion.div key={p.id}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 bg-gradient-to-br ${p.gradient} p-8 sm:p-12 flex flex-col justify-center`}>
            <div className="text-5xl sm:text-6xl mb-4">{p.emoji}</div>
            <span className="inline-block text-white/70 text-xs font-bold uppercase tracking-widest mb-2">{p.tag}</span>
            <h3 className="text-white text-3xl sm:text-5xl font-black leading-tight mb-2">{p.title}</h3>
            <p className="text-white/90 text-xl sm:text-2xl font-bold mb-2">{p.subtitle}</p>
            <p className="text-white/70 text-sm mb-6 max-w-sm">{p.desc}</p>
            <Link to={p.link}>
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-bold rounded-2xl transition-all text-sm shadow-lg">
                Xem ngay <ArrowRight size={16} />
              </motion.button>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Nav buttons */}
      <button onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all backdrop-blur">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all backdrop-blur">
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {promotions.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setIsAuto(false); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

// ─── Auth Nudge Section ──────────────────────────────────────────────────────
const AuthNudgeSection = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const { user } = useAuth();

  const openModal = (tab) => {
    setModalTab(tab);
    setLoginModalOpen(true);
  };

  if (user) return null;

  const nudgeBenefits = ['🎯 Gợi ý cá nhân', '❤️ Yêu thích', '📦 Theo dõi đơn', '🎁 Ưu đãi thành viên'];

  return (
    <>
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-t border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10">

            {/* Icon + text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-5">
                <UserCheck size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                Đăng nhập để trải nghiệm<br className="hidden sm:block" /> cá nhân hoá
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg mb-5">
                Nhận gợi ý sản phẩm phù hợp phong cách của bạn. Theo dõi đơn hàng, lưu yêu thích và nhận ưu đãi độc quyền.
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {nudgeBenefits.map((b) => (
                  <span key={b} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100">{b}</span>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => openModal('login')}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-600/25 text-sm">
                Đăng nhập
              </motion.button>
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => openModal('register')}
                className="px-8 py-3.5 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold rounded-2xl transition-colors text-sm">
                Đăng ký
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        initialTab={modalTab}
      />
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeContext, setActiveContext] = useState(null);

  useEffect(() => {
    productService.getFeatured()
      .then(setFeatured).catch(() => setFeatured()).finally(() => setLoadingFeatured(false));
    productService.getBestSellers()
      .then(setBestSellers).catch(() => setBestSellers([])).finally(() => setLoadingBest(false));
    productService.getNewArrivals()
      .then(setNewArrivals).catch(() => setNewArrivals([])).finally(() => setLoadingNew(false));
    api.get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([])).finally(() => setLoadingCats(false));
  }, []);

  const normalizeProduct = (p) => ({
    ...p,
    price: p.basePrice,
    originalPrice: p.comparePrice,
    discount: p.comparePrice > p.basePrice ? Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100) : 0,
    rating: parseFloat(p.ratingAvg) || 0,
    reviewCount: p.ratingCount || 0,
    stock: p.variants?.[0]?.availableStock ?? 0,
    colors: p.variants?.map((v) => v.name) || [],
    features: [],
  });

  const normFeatured = (featured || []).map(normalizeProduct);
  const normBest = bestSellers.map(normalizeProduct);
  const normNew = newArrivals.map(normalizeProduct);

  const mainCats = categories.filter((c) => c.parentId === null);
  const displayedCats = showAllCategories ? mainCats : mainCats.slice(0, 12);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="NIVORA Hero" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
          <div className="absolute inset-0 bg-emerald-950/15" />
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-teal-400/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8">
              <Sparkles size={14} className="text-emerald-400" />
              Bộ sưu tập mới — 2025
            </motion.div>

            <motion.div variants={staggerText} initial="hidden" animate="visible" className="mb-7">
              {['PHONG CÁCH', 'RIÊNG', 'CHẤT RIÊNG', 'BẠN.'].map((word, i) => (
                <motion.h1 key={word} variants={textLine}
                  className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight"
                  style={{ textShadow: '0 4px 32px rgba(0,0,0,0.4)' }}>
                  {i === 1 ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-200">{word}</span>
                  ) : i === 3 ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">{word}</span>
                  ) : (
                    <span className="text-white">{word}</span>
                  )}
                </motion.h1>
              ))}
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              className="text-gray-300 text-lg leading-relaxed mb-10 max-w-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              Nivora mang đến những thiết kế tinh tế, chất liệu cao cấp và phong cách hiện đại — để bạn luôn tự tin trong mọi khoảnh khắc.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-4">
              <Link to="/products">
                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold rounded-2xl transition-colors shadow-2xl shadow-emerald-900/60">
                  Khám phá ngay <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link to="/products?filter=new">
                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-base font-bold rounded-2xl border border-white/25 hover:border-white/40 transition-all">
                  Hàng mới về
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════
          PERKS BAR
      ══════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex items-center gap-4 group cursor-default">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${perkColors[color]}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CONTEXTUAL RECOMMENDATION TAGS
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Gợi ý phổ biến</p>
          <div className="flex flex-wrap gap-3">
            {contextualTags.map((tag) => {
              const Icon = tag.icon;
              const isActive = activeContext === tag.filter;
              return (
                <motion.button key={tag.filter}
                  whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveContext(isActive ? null : tag.filter)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-300 shadow-sm ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : `${tag.color} hover:shadow-md`
                  }`}>
                  <Icon size={14} />
                  {tag.label}
                </motion.button>
              );
            })}
          </div>
          {activeContext && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-gray-500 mt-3 font-medium">
              💡 Chức năng cá nhân hoá sẽ được tối ưu khi bạn <Link to="/login" className="text-emerald-600 font-bold underline underline-offset-2">đăng nhập</Link>
            </motion.p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROMO BANNERS + REGIONAL SPOTLIGHT
      ══════════════════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Main promo carousel */}
            <div className="lg:col-span-2">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-5">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-rose-500" />
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Khuyến mãi hot</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mt-1">Ưu đãi được quan tâm nhiều nhất</h2>
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <PromoBannerCarousel />
              </motion.div>
            </div>

            {/* Regional cards */}
            <div className="flex flex-col gap-4">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-1">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Theo khu vực</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mt-1">Phổ biến trong khu vực</h2>
              </motion.div>
              {regionalSections.map((region, i) => (
                <motion.div key={region.key} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to={`/products?region=${region.key}`}
                    className={`block relative rounded-2xl overflow-hidden bg-gradient-to-br ${region.color} p-5 cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-3xl mb-2">{region.emoji}</div>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-0.5">{region.desc}</p>
                        <h3 className="text-white text-lg font-black">{region.city}</h3>
                      </div>
                      <ArrowRight size={20} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
                    </div>
                    <p className="text-white/60 text-xs mt-2">Xem sản phẩm đang hot tại {region.city} →</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Danh mục" badgeIcon={Tag} title="Mua sắm theo danh mục chính" />

          {loadingCats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-3xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : mainCats.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có danh mục chính nào</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayedCats.map((cat, i) => (
                  <motion.div key={cat.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <Link to={`/products?category=${cat.slug}`}
                      className="group block relative rounded-3xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <span className="text-4xl">{cat.icon || '📦'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />
                      <div className="absolute inset-0 rounded-3xl ring-0 group-hover:ring-2 group-hover:ring-emerald-400/50 transition-all duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-bold text-sm group-hover:text-emerald-300 transition-colors">{cat.name}</p>
                        {cat.productCount > 0 && <p className="text-gray-300 text-xs mt-0.5">{cat.productCount} sản phẩm</p>}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {mainCats.length > 12 && (
                <div className="text-center mt-10">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 text-sm font-bold rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md">
                    {showAllCategories ? 'Thu gọn' : 'Xem thêm danh mục'}
                    <motion.span animate={{ rotate: showAllCategories ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-block">
                      <ChevronDown size={16} />
                    </motion.span>
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Nổi bật" badgeIcon={Star} title="Lựa chọn hàng đầu" viewAll viewAllHref="/products" />
          {loadingFeatured ? <ProductRowSkeleton /> : normFeatured.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có sản phẩm nổi bật</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {normFeatured.map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          GENDER TREND SECTIONS
      ══════════════════════════════════════════════ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp size={15} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Xu hướng</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Phong cách theo xu hướng</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {genderTrends.map((g, idx) => {
              const GIcon = g.Icon;
              return (
                <motion.div key={g.key} custom={idx} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div className={`rounded-3xl bg-gradient-to-br ${g.gradient} p-7 sm:p-9 shadow-xl relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300`}>
                    {/* Background icon watermark */}
                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                      <GIcon size={180} className="text-white" strokeWidth={1} />
                    </div>
                    {/* Header row */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${g.accent} border`}>
                        <GIcon size={28} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-white text-xl sm:text-2xl font-black leading-tight">{g.label}</h3>
                        <p className="text-white/60 text-sm mt-1">{g.desc}</p>
                      </div>
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-7">
                      {g.tags.map((tag) => (
                        <span key={tag}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border cursor-pointer transition-all hover:scale-105 ${g.accent}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link to={`/products?trend=${g.key}`}>
                      <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/25 text-white font-bold text-sm rounded-2xl transition-all shadow-sm">
                        Khám phá ngay <ArrowRight size={15} />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROMO BANNER CTA
      ══════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/92 via-emerald-800/80 to-gray-900/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-xs font-bold uppercase tracking-widest mb-5 backdrop-blur">
              <Gift size={13} className="text-emerald-400" /> Ưu đãi có hạn
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Giảm đến 30%</h2>
            <p className="text-emerald-100 text-lg mb-10 max-w-md mx-auto">Ưu đãi thời gian có hạn cho các sản phẩm được chọn. Đừng bỏ lỡ!</p>
            <Link to="/products">
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-9 py-4 bg-white text-gray-900 text-base font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-2xl">
                Mua ngay <ArrowRight size={18} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BEST SELLERS
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Xu hướng" badgeIcon={Flame} title="Bán chạy nhất" viewAll viewAllHref="/products" />
          {loadingBest ? <ProductRowSkeleton /> : normBest.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có sản phẩm bán chạy</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {normBest.map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          NEW ARRIVALS
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Mới nhất" badgeIcon={Sparkles} title="Hàng mới về" viewAll viewAllHref="/products?filter=new" />
          {loadingNew ? <ProductRowSkeleton /> : normNew.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có hàng mới</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {normNew.map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          LOGIN NUDGE (for guest users)
      ══════════════════════════════════════════════ */}
      <AuthNudgeSection />

    </div>
  );
};

export default Home;
