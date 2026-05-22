import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones,
  Star, TrendingUp, Sparkles
} from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import { CardSkeleton } from '../../components/common/Loading';
import { productService } from '../../services/productService';
import api from '../../services/api';
import heroBg from '../../assets/background-2.png';

const perks = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 500.000đ' },
  { icon: ShieldCheck, title: 'Thanh toán an toàn', desc: 'Bảo mật 100%' },
  { icon: RotateCcw, title: 'Đổi trả dễ dàng', desc: 'Trong vòng 30 ngày' },
  { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng hỗ trợ' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerText = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const textLine = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// Skeleton row for product sections
const ProductRowSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    productService.getFeatured()
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));

    productService.getBestSellers()
      .then(setBestSellers)
      .catch(() => setBestSellers([]))
      .finally(() => setLoadingBest(false));

    productService.getNewArrivals()
      .then(setNewArrivals)
      .catch(() => setNewArrivals([]))
      .finally(() => setLoadingNew(false));

    api.get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  // Normalize product from API to match ProductCard expectations
  const normalizeProduct = (p) => ({
    ...p,
    price: p.basePrice,
    originalPrice: p.comparePrice,
    discount: p.comparePrice > p.basePrice
      ? Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100)
      : 0,
    rating: parseFloat(p.ratingAvg) || 0,
    reviewCount: p.ratingCount || 0,
    stock: p.variants?.[0]?.availableStock ?? 0,
    colors: p.variants?.map((v) => v.name) || [],
    features: [],
  });

  const normFeatured = featured.map(normalizeProduct);
  const normBest = bestSellers.map(normalizeProduct);
  const normNew = newArrivals.map(normalizeProduct);

  return (
    <div>
      {/* ══ HERO ══ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="NIVORA Hero" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          <div className="absolute inset-0 bg-emerald-950/20" />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float-slow animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-400/8 rounded-full blur-3xl animate-float-medium" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8"
            >
              <Sparkles size={14} className="text-emerald-400" />
              Bộ sưu tập mới — 2024
            </motion.div>
            <motion.div variants={staggerText} initial="hidden" animate="visible" className="mb-7">
              <motion.h1 variants={textLine} className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight" style={{ textShadow: '0 4px 32px rgba(0,0,0,0.4)' }}>
                PHONG CÁCH
              </motion.h1>
              <motion.h1 variants={textLine} className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight" style={{ textShadow: '0 4px 32px rgba(0,0,0,0.4)' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-200">RIÊNG</span>
              </motion.h1>
              <motion.h1 variants={textLine} className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight" style={{ textShadow: '0 4px 32px rgba(0,0,0,0.4)' }}>
                CHẤT RIÊNG
              </motion.h1>
              <motion.h1 variants={textLine} className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight" style={{ textShadow: '0 4px 32px rgba(0,0,0,0.4)' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">BẠN.</span>
              </motion.h1>
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              className="text-gray-300 text-lg leading-relaxed mb-10 max-w-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              Nivora mang đến những thiết kế tinh tế, chất liệu cao cấp và phong cách hiện đại — để bạn luôn tự tin trong mọi khoảnh khắc.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-wrap gap-4">
              <Link to="/products">
                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold rounded-2xl transition-colors shadow-2xl shadow-emerald-900/60 shine">
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

      {/* ══ PERKS ══ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                  <Icon size={22} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Danh mục</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Mua sắm theo danh mục</h2>
            <p className="text-gray-500">Tìm chính xác những gì bạn đang tìm kiếm</p>
          </motion.div>
          {loadingCats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-3xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có danh mục nào</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat, i) => (
                <motion.div key={cat.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to={`/products?category=${cat.slug}`}
                    className="group block relative rounded-3xl overflow-hidden aspect-square shadow-card hover:shadow-card-hover transition-all duration-500">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                        <span className="text-4xl">{cat.icon || '📦'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/85 transition-all duration-300" />
                    <div className="absolute inset-0 rounded-3xl ring-0 group-hover:ring-2 group-hover:ring-emerald-400/40 transition-all duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-bold text-sm group-hover:text-emerald-300 transition-colors">{cat.name}</p>
                      {cat.productCount > 0 && <p className="text-gray-300 text-xs">{cat.productCount} sản phẩm</p>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ FEATURED ══ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-emerald-600 fill-emerald-600" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Nổi bật</span>
              </div>
              <h2 className="text-4xl font-black text-gray-900">Lựa chọn hàng đầu</h2>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group">
              Xem tất cả <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          {loadingFeatured ? <ProductRowSkeleton /> : normFeatured.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có sản phẩm nổi bật</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {normFeatured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══ BANNER CTA ══ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-gray-900/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <p className="text-emerald-300 text-sm font-bold uppercase tracking-widest mb-4">Ưu đãi có hạn</p>
            <h2 className="text-5xl font-black text-white mb-4">Giảm đến 30%</h2>
            <p className="text-emerald-100 text-lg mb-10 max-w-md mx-auto">Ưu đãi thời gian có hạn cho các sản phẩm được chọn. Đừng bỏ lỡ!</p>
            <Link to="/products">
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-9 py-4 bg-white text-gray-900 text-base font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-2xl shine">
                Mua ngay <ArrowRight size={18} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ BEST SELLERS ══ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Xu hướng</span>
              </div>
              <h2 className="text-4xl font-black text-gray-900">Bán chạy nhất</h2>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group">
              Xem tất cả <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          {loadingBest ? <ProductRowSkeleton /> : normBest.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có sản phẩm bán chạy</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {normBest.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══ NEW ARRIVALS ══ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Mới nhất</span>
              </div>
              <h2 className="text-4xl font-black text-gray-900">Hàng mới về</h2>
            </div>
            <Link to="/products?filter=new" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group">
              Xem tất cả <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          {loadingNew ? <ProductRowSkeleton /> : normNew.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có hàng mới</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {normNew.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
