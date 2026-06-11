import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, RotateCcw } from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import { CardSkeleton } from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';
import { recommendationService } from '../../services/recommendationService';
import { productService } from '../../services/productService';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

// ─── Components ──────────────────────────────────────────────────────────────
const ProductRowSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

const SectionHeader = ({ title, desc, badge, badgeColor = 'emerald', viewAll, viewAllHref }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3 border-b border-gray-100 pb-4">
    <div>
      {badge && (
        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 border ${
          badgeColor === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
          badgeColor === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {badge}
        </span>
      )}
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight uppercase">{title}</h2>
      {desc && <p className="text-gray-400 text-xs sm:text-sm mt-1.5 font-light">{desc}</p>}
    </div>
    {viewAll && (
      <Link to={viewAllHref || '/products'}
        className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-500 hover:text-black transition-colors group shrink-0">
        Xem tất cả <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackSearch } = useBehaviorTracker();

  // Recommendations State
  const [personal, setPersonal] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [youMayNeed, setYouMayNeed] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  // Sub-states
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [popularSearches, setPopularSearches] = useState(['Ghế xoay', 'Bàn làm việc', 'Kệ tivi']);
  
  // Tab index for Personal Suggestions
  const [activeRecTab, setActiveRecTab] = useState(0); // 0: Dành riêng cho bạn, 1: Có thể bạn thích
  const [activeBestSellerCat, setActiveBestSellerCat] = useState(null); // Category filter for BestSellers

  // Countdown timer for Flash Sale
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 23, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Typewriter placeholder effect
  const placeholderPhrases = useMemo(() => [
    'Tìm kiếm bàn làm việc, ghế xoay, sofa, giường ngủ, kệ tủ...',
    'Tìm kiếm áo thun, quần jean, áo khoác, váy đầm, thời trang nam nữ...',
    'Tìm kiếm giày thể thao, giày tây, túi xách thời thượng, ví da...',
    'Tìm kiếm thảm trải sàn, đèn ngủ thông minh, đồ trang trí tinh tế cho ngôi nhà bạn...'
  ], []);

  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer;

    const tick = () => {
      const currentPhrase = placeholderPhrases[phraseIdx];
      if (!isDeleting) {
        setPlaceholder(currentPhrase.substring(0, charIdx + 1));
        charIdx++;
        if (charIdx === currentPhrase.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2500); // Pause on full phrase
        } else {
          timer = setTimeout(tick, 40); // Typing speed
        }
      } else {
        setPlaceholder(currentPhrase.substring(0, charIdx - 1));
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % placeholderPhrases.length;
          timer = setTimeout(tick, 400); // Pause before next phrase
        } else {
          timer = setTimeout(tick, 20); // Deleting speed
        }
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, [placeholderPhrases]);

  const loadAllData = () => {
    setLoading(true);
    // Fetch categories
    api.get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));

    // Fetch popular searches from backend
    productService.getPopularSearches(5)
      .then((data) => {
        if (data && data.length > 0) {
          setPopularSearches(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load popular searches', err);
      });

    // Fetch homepage recommendations orchestration API
    recommendationService.getHomepageRecommendations()
      .then((data) => {
        if (data) {
          setPersonal(data.personal || []);
          setTrending(data.trending || []);
          setRecent(data.recent || []);
          setYouMayNeed(data.youMayNeed || []);
          setFeatured(data.featured || []);
          setBestSellers(data.bestSellers || []);
          setNewArrivals(data.newArrivals || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load recommendations', err);
        toast.error('Có lỗi xảy ra khi nạp sản phẩm gợi ý');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Normalize mapping for rendering
  const normalizeProduct = (p) => {
    if (!p) return null;
    return {
      ...p,
      price: p.basePrice ?? p.price,
      originalPrice: p.comparePrice ?? p.originalPrice,
      discount: p.comparePrice > p.basePrice ? Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100) : (p.discount ?? 0),
      rating: parseFloat(p.ratingAvg ?? p.rating) || 4.5,
      reviewCount: (p.ratingCount ?? p.reviewCount) || 12,
      stock: p.stock ?? 10,
    };
  };

  // Memoized listings
  const normFeatured = useMemo(() => featured.map(normalizeProduct).filter(Boolean), [featured]);
  const normBest = useMemo(() => bestSellers.map(normalizeProduct).filter(Boolean), [bestSellers]);
  const normNew = useMemo(() => newArrivals.map(normalizeProduct).filter(Boolean), [newArrivals]);
  const normTrending = useMemo(() => trending.map(normalizeProduct).filter(Boolean), [trending]);
  const normPersonal = useMemo(() => personal.map(normalizeProduct).filter(Boolean), [personal]);
  const normRecent = useMemo(() => recent.map(normalizeProduct).filter(Boolean), [recent]);
  const normYouMayNeed = useMemo(() => youMayNeed.map(normalizeProduct).filter(Boolean), [youMayNeed]);

  // Filter BestSellers by category dynamically on client side
  const filteredBestSellers = useMemo(() => {
    if (!activeBestSellerCat) return normBest;
    return normBest.filter(p => p.category?.id === activeBestSellerCat || p.category?.name === activeBestSellerCat);
  }, [normBest, activeBestSellerCat]);

  // BestSeller category list
  const bestSellerCats = useMemo(() => {
    const cats = normBest.map(p => p.category).filter(Boolean);
    const unique = [];
    const ids = new Set();
    for (const c of cats) {
      if (!ids.has(c.id)) {
        ids.add(c.id);
        unique.push(c);
      }
    }
    return unique.slice(0, 4);
  }, [normBest]);

  const mainCats = categories.filter((c) => c.parentId === null);
  const displayedCats = mainCats.slice(0, 10);

  // Search submit handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (aiSearchQuery.trim()) {
      trackSearch(aiSearchQuery.trim());
      navigate(`/products?search=${encodeURIComponent(aiSearchQuery.trim())}`);
    }
  };

  const handlePopularSearchClick = (kw) => {
    setAiSearchQuery(kw);
    trackSearch(kw);
    navigate(`/products?search=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* 1. Hero Banner */}
      <section className="relative bg-slate-900 border-b border-slate-800 py-20 sm:py-28 text-white overflow-hidden">
        {/* Subtle radial emerald gradient to inject premium color highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0,transparent_100%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-3.5 block">NIVORA COLLECTION 2026</span>
            <h1 className="text-3xl sm:text-5xl font-light leading-tight tracking-tight text-white mb-4 uppercase">
              Thiết kế không gian sống <span className="font-semibold text-emerald-400">tối giản</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mb-8 font-light leading-relaxed">
              Khám phá các sản phẩm nội thất tinh tế, kết hợp hài hòa giữa công năng sử dụng và tính thẩm mỹ đương đại.
            </p>
 
            {/* Clean Search Input */}
            <div className="max-w-xl mx-auto mb-4">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white border border-slate-700/80 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200 rounded-lg p-1">
                <input
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder={placeholder || "Tìm kiếm bàn làm việc, ghế xoay, sofa, giường ngủ, kệ tủ..."}
                  className="flex-1 bg-transparent px-3 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
                >
                  <Search size={13} />
                  <span>Tìm kiếm</span>
                </button>
              </form>
              <div className="flex items-center justify-center gap-2 mt-3 text-slate-400 text-xs font-normal">
                <span>Tìm nhiều nhất:</span>
                {popularSearches.map((kw) => (
                  <button 
                    key={kw}
                    onClick={() => handlePopularSearchClick(kw)} 
                    className="text-slate-350 hover:text-emerald-400 underline transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main sections container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* 2. Danh mục nổi bật */}
        <section>
          <SectionHeader badge="Danh mục" badgeColor="emerald" title="Khám phá danh mục" desc="Tìm kiếm sản phẩm dễ dàng theo từng khu vực và công năng sử dụng" />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-square rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : mainCats.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-10">Chưa có dữ liệu danh mục</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {displayedCats.map((cat, i) => (
                <motion.div key={cat.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link to={`/products?category=${cat.slug}`}
                    className="group block relative rounded overflow-hidden aspect-square border border-gray-200/60 bg-white transition-all duration-300 hover:border-gray-900">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                        <span className="text-2xl">{cat.icon || '📦'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wide">{cat.name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Xu hướng mua sắm */}
        <section>
          <SectionHeader 
            badge="Xu hướng"
            badgeColor="amber"
            title="Xu hướng mua sắm" 
            desc="Những mẫu sản phẩm nội thất được khách hàng quan tâm nhiều nhất trong tuần"
            viewAll 
            viewAllHref="/products" 
          />
          {loading ? <ProductRowSkeleton /> : normTrending.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-10">Chưa có xếp hạng xu hướng</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {normTrending.slice(0, 4).map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Sản phẩm nổi bật */}
        <section>
          <SectionHeader 
            badge="Nổi bật"
            badgeColor="emerald"
            title="Sản phẩm nổi bật" 
            desc="Bộ sưu tập sản phẩm thiết kế mới ra mắt tuần này"
            viewAll 
            viewAllHref="/products" 
          />
          {loading ? <ProductRowSkeleton /> : normNew.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-10">Chưa có sản phẩm nổi bật mới</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {normNew.slice(0, 4).map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Bán chạy nhất */}
        <section className="bg-gray-50/35 rounded-xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4 pb-4 border-b border-gray-200/60">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight uppercase">Sản phẩm bán chạy nhất</h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1.5 font-light">Những sản phẩm có lượt mua cao và đánh giá hài lòng tốt nhất</p>
            </div>
            
            {/* Category Filter for Best Sellers */}
            {bestSellerCats.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveBestSellerCat(null)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                    activeBestSellerCat === null
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-650 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Tất cả
                </button>
                {bestSellerCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveBestSellerCat(cat.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                      activeBestSellerCat === cat.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-650 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? <ProductRowSkeleton /> : filteredBestSellers.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-10">Không có sản phẩm bán chạy phù hợp</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredBestSellers.slice(0, 4).map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Gợi ý cho bạn (Dynamic tab layout) */}
        <section className="bg-white rounded-xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-gray-200/60 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight uppercase">Gợi ý dành cho bạn</h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1.5 font-light">Các mẫu sản phẩm phù hợp được sắp xếp dựa trên sự quan tâm của bạn</p>
            </div>

            {/* Tabs selection */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {['Sản phẩm phù hợp', 'Có thể bạn thích'].map((tabLabel, idx) => (
                <button
                  key={tabLabel}
                  onClick={() => setActiveRecTab(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                    activeRecTab === idx 
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-805'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[260px]">
            {loading ? (
              <ProductRowSkeleton />
            ) : (() => {
              // Determine active suggestions lists
              const listToRender = activeRecTab === 0 
                ? (normPersonal.length > 0 ? normPersonal : normFeatured)
                : (normYouMayNeed.length > 0 ? normYouMayNeed : normTrending);

              if (listToRender.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-gray-450 text-xs font-semibold">Chưa có thông tin gợi ý</p>
                    <p className="text-gray-400 text-[11px] mt-1 font-light">Hãy tiếp tục duyệt sản phẩm để chúng tôi hiển thị gợi ý phù hợp nhất</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {listToRender.slice(0, 4).map((p, i) => (
                    <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        {/* 7. Sản phẩm đã xem gần đây */}
        {normRecent.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 p-6 sm:p-8">
            <SectionHeader badge="Lịch sử" badgeColor="emerald" title="Sản phẩm đã xem gần đây" desc="Xem lại danh sách sản phẩm bạn vừa tham khảo và tìm kiếm gần đây" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {normRecent.slice(0, 6).map((p) => (
                <div key={p.id} className="group relative bg-white hover:bg-gray-50/50 rounded border border-gray-200/80 p-2.5 transition-all duration-300">
                  <Link to={`/products/${p.id}`} className="block aspect-square rounded overflow-hidden bg-gray-50 mb-2.5">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  </Link>
                  <h3 className="font-normal text-gray-800 text-xs truncate mb-1">{p.name}</h3>
                  <p className="text-gray-900 font-semibold text-xs">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Khuyến mãi (Promotions / Banners) */}
        <section className="border-t border-b border-gray-200/60 py-16 bg-gray-50/50 rounded-xl px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="bg-red-50/35 p-8 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
              <div>
                <span className="text-[10px] font-bold text-red-650 uppercase tracking-widest block mb-2">⚡ Khuyến mãi có hạn</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">SIÊU FLASH SALE MÙA HÈ</h3>
                <p className="text-gray-600 text-xs sm:text-sm font-light mb-6 leading-relaxed">
                  Cơ hội sở hữu các sản phẩm nội thất sang trọng với mức chiết khấu lên đến 50%. Ưu đãi diễn ra trong thời gian ngắn, số lượng giới hạn.
                </p>
              </div>
              
              {/* Countdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kết thúc sau:</span>
                <div className="flex items-center gap-1">
                  <span className="w-8 h-8 rounded bg-rose-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="text-rose-600 font-bold">:</span>
                  <span className="w-8 h-8 rounded bg-rose-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className="text-rose-600 font-bold">:</span>
                  <span className="w-8 h-8 rounded bg-rose-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">{String(countdown.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/35 p-8 rounded-lg border border-emerald-100 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-2">🌿 Thành viên độc quyền</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">Đặc quyền thành viên Nivora</h3>
                <p className="text-gray-600 text-xs sm:text-sm font-light mb-6 leading-relaxed">
                  Đăng ký tài khoản thành viên Nivora ngay hôm nay để nhận mã giảm giá 10% cho đơn hàng đầu tiên, chính sách tích điểm đổi quà và giao hàng ưu tiên.
                </p>
              </div>
              {!user ? (
                <Link to="/register" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors text-center shadow-sm">
                  Đăng ký tài khoản miễn phí
                </Link>
              ) : (
                <div className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                  ✓ Bạn đã kích hoạt tài khoản thành viên Nivora
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 9. Đánh giá cao */}
        <section>
          <SectionHeader 
            badge="Đánh giá"
            badgeColor="emerald"
            title="Đánh giá cao nhất" 
            desc="Những sản phẩm nhận được phản hồi hài lòng cao nhất từ khách hàng đã sử dụng"
            viewAll 
            viewAllHref="/products" 
          />
          {loading ? <ProductRowSkeleton /> : normFeatured.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-10">Chưa có sản phẩm xếp hạng tốt</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {normFeatured.filter(p => p.rating >= 4.5).slice(0, 4).map((p, i) => (
                <motion.div key={p.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Home;
