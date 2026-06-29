import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { recommendationService } from '../../services/recommendationService';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';
import RecommendationSection from '../../components/product/RecommendationSection';
import ProductCard from '../../components/product/ProductCard';
import { productService } from '../../services/productService';
import heroBannerImg from '../../assets/hero-banner.png';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ─── Animations ──────────────────────────────────────────────────────────────

const Home = () => {
  const { user } = useAuth();

  // Search parameters and states
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Recommendations State
  const [personal, setPersonal] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [youMayNeed, setYouMayNeed] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [locationBasedRecs, setLocationBasedRecs] = useState([]);

  // Sub-states
  const [categoryMains, setCategoryMains] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  const loadAllData = () => {
    setLoading(true);
    setPersonal([]);
    setTrending([]);
    setRecent([]);
    setYouMayNeed([]);
    setFeatured([]);
    setBestSellers([]);
    setNewArrivals([]);
    setLocationBasedRecs([]);

    // Fetch category mains
    api.get('/category-mains')
      .then((res) => setCategoryMains(res.data.data || []))
      .catch(() => setCategoryMains([]));

    // Fetch regional location-based recommendations
    recommendationService.getLocationBasedRecommendations(20)
      .then((data) => setLocationBasedRecs(data || []))
      .catch(() => setLocationBasedRecs([]));

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
      rating: parseFloat(p.ratingAvg ?? p.rating ?? 0),
      reviewCount: parseInt(p.ratingCount ?? p.reviewCount ?? 0),
      stock: p.stock ?? 10,
    };
  };

  // Fetch search results when query parameter changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    productService.searchPaginated(searchQuery.trim(), {
      page: 0,
      size: 20,
      rerank: true,
    })
    .then((data) => {
      const normalized = (data?.content || []).map(normalizeProduct).filter(Boolean);
      setSearchResults(normalized);
    })
    .catch((err) => {
      console.error('Failed to search homepage products:', err);
      toast.error('Không thể tìm kiếm sản phẩm. Vui lòng thử lại.');
      setSearchResults([]);
    })
    .finally(() => {
      setSearchLoading(false);
    });
  }, [searchQuery]);

  // Memoized listings
  const normFeatured = useMemo(() => featured.map(normalizeProduct).filter(Boolean), [featured]);
  const normBest = useMemo(() => bestSellers.map(normalizeProduct).filter(Boolean), [bestSellers]);
  const normNew = useMemo(() => newArrivals.map(normalizeProduct).filter(Boolean), [newArrivals]);
  const normTrending = useMemo(() => trending.map(normalizeProduct).filter(Boolean), [trending]);
  const normPersonal = useMemo(() => personal.map(normalizeProduct).filter(Boolean), [personal]);
  const normRecent = useMemo(() => recent.map(normalizeProduct).filter(Boolean), [recent]);
  const normYouMayNeed = useMemo(() => youMayNeed.map(normalizeProduct).filter(Boolean), [youMayNeed]);
  const normLocationBased = useMemo(() => locationBasedRecs.map(normalizeProduct).filter(Boolean), [locationBasedRecs]);

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

  return (
    <div className="min-h-screen bg-white">
      
      {/* 1. Hero Banner */}
      {!searchQuery && (
        <section 
          className="relative border-b border-gray-100 text-white overflow-hidden flex items-center h-[420px] lg:h-[520px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBannerImg})` }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/45 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
            <div className="max-w-2xl text-left">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-3.5 block">NIVORA COLLECTION 2026</span>
              <h1 className="text-3xl sm:text-5xl font-light leading-tight tracking-tight text-white mb-4 uppercase">
                Không gian sống <span className="font-semibold text-emerald-400 block sm:inline">hiện đại</span>
              </h1>
              <p className="text-gray-200 text-xs sm:text-sm max-w-lg mb-8 font-light leading-relaxed">
                Khám phá hàng nghìn sản phẩm nội thất và thời trang được tuyển chọn.
              </p>
   
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-600 hover:border-emerald-500 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 shadow-md uppercase tracking-wider text-center min-w-[130px]"
                >
                  Mua ngay
                </Link>
                <Link
                  to="/products"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 shadow-md backdrop-blur-sm uppercase tracking-wider text-center min-w-[130px]"
                >
                  Khám phá bộ sưu tập
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main sections container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {searchQuery ? (
          <section className="py-4 min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 border bg-emerald-50 text-emerald-600 border-emerald-100">
                  Kết quả tìm kiếm
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight uppercase">
                  Kết quả tìm kiếm cho: "{searchQuery}"
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1.5 font-light">
                  Tìm thấy {searchResults.length} sản phẩm phù hợp
                </p>
              </div>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-pulse">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 p-4 flex flex-col justify-end gap-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm font-semibold">
                  Không tìm thấy sản phẩm nào phù hợp với "{searchQuery}".
                </p>
                <p className="text-gray-400 text-xs mt-1.5 font-light">
                  Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bớt ký tự.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* 3. Bán chạy nhất */}
            <RecommendationSection
              badge="Bán chạy"
              badgeColor="emerald"
              title="Sản phẩm bán chạy nhất"
              desc="Những sản phẩm có lượt mua cao và đánh giá hài lòng tốt nhất"
              products={filteredBestSellers}
              loading={loading}
              containerClassName="border-b border-gray-100 pb-12"
              headerExtra={
                bestSellerCats.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveBestSellerCat(null)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                        activeBestSellerCat === null
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-gray-655 border-gray-200 hover:border-gray-300'
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
                            : 'bg-white text-gray-655 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )
              }
            />

            {/* 4. Khuyến mãi (Promotions / Banners) */}
            <section className="border-t border-b border-gray-200/65 py-16 bg-gray-50/50 rounded-xl px-4 sm:px-8 my-8">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="bg-red-50/35 p-8 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
                  <div>
                    <span className="text-[10px] font-bold text-red-650 uppercase tracking-widest block mb-2">⚡ Khuyến mãi có hạn</span>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">SIÊU FLASH SALE MÙA HÈ</h3>
                    <p className="text-gray-600 text-xs sm:text-sm font-light mb-6 leading-relaxed">
                      Cơ hội sở hữu các sản phẩm thiết kế sang trọng với mức chiết khấu lên đến 50%. Ưu đãi diễn ra trong thời gian ngắn, số lượng giới hạn.
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
                    <Link to="/register" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-semibold rounded transition-colors text-center shadow-sm">
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

            {/* 5. Sản phẩm nổi bật (New Arrivals) */}
            <RecommendationSection
              badge="Mới về"
              badgeColor="emerald"
              title="Sản phẩm mới ra mắt"
              desc="Bộ sưu tập sản phẩm thiết kế mới ra mắt tuần này"
              products={normNew}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="border-b border-gray-100 pb-12"
            />

            {/* 6. Gợi ý cho bạn */}
            <RecommendationSection
              badge="Gợi ý"
              badgeColor="emerald"
              title="Gợi ý dành cho bạn"
              desc="Các mẫu sản phẩm phù hợp được sắp xếp dựa trên sự quan tâm của bạn"
              products={activeRecTab === 0 
                ? (normPersonal.length > 0 ? normPersonal : normFeatured)
                : (normYouMayNeed.length > 0 ? normYouMayNeed : normTrending)
              }
              loading={loading}
              containerClassName="bg-white border-b border-gray-100 pb-12"
              headerExtra={
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {['Sản phẩm phù hợp', 'Có thể bạn thích'].map((tabLabel, idx) => (
                    <button
                      key={tabLabel}
                      onClick={() => setActiveRecTab(idx)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                        activeRecTab === idx 
                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {tabLabel}
                    </button>
                  ))}
                </div>
              }
            />

            {/* 7. Xu hướng mua sắm */}
            <RecommendationSection
              badge="Xu hướng"
              badgeColor="amber"
              title="Xu hướng mua sắm"
              desc="Những sản phẩm nổi bật được khách hàng quan tâm nhiều nhất trong tuần"
              products={normTrending}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="border-b border-gray-100 pb-12"
            />

            {/* 8. Thịnh hành theo khu vực */}
            <RecommendationSection
              badge="Khu vực"
              badgeColor="emerald"
              title="Thịnh hành theo khu vực nhận hàng"
              desc={user ? "Sản phẩm được mua nhiều nhất xung quanh địa chỉ giao hàng của bạn" : "Sản phẩm bán chạy tại các khu vực giao nhận trên toàn quốc"}
              products={normLocationBased}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="border-b border-gray-100 pb-12"
            />

            {/* 9. Đánh giá cao nhất */}
            <RecommendationSection
              badge="Đánh giá"
              badgeColor="emerald"
              title="Đánh giá cao nhất"
              desc="Những sản phẩm nhận được phản hồi hài lòng cao nhất từ khách hàng đã sử dụng"
              products={useMemo(() => normFeatured.filter(p => p.rating >= 4.5), [normFeatured])}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="border-b border-gray-100 pb-12"
            />

            {/* 10. Sản phẩm đã xem gần đây */}
            {normRecent.length > 0 && (
              <RecommendationSection
                badge="Lịch sử"
                badgeColor="emerald"
                title="Sản phẩm đã xem gần đây"
                desc="Xem lại danh sách sản phẩm bạn vừa tham khảo và tìm kiếm gần đây"
                products={normRecent}
                loading={loading}
                containerClassName="pb-12"
              />
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Home;
