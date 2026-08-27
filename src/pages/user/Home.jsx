import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { recommendationService } from '../../services/recommendationService';
import RecommendationSection from '../../components/product/RecommendationSection';
import ProductCard from '../../components/product/ProductCard';
import { productService } from '../../services/productService';
import heroBannerImg from '../../assets/hero-banner.png';
import HeroAISuggestions from '../../components/product/HeroAISuggestions';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ProductGridSkeleton } from '../../components/common/Loading';

const Home = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [personal, setPersonal] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [youMayNeed, setYouMayNeed] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [locationBasedRecs, setLocationBasedRecs] = useState([]);

  const [categoryMains, setCategoryMains] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeRecTab, setActiveRecTab] = useState(0);
  const [activeBestSellerCat, setActiveBestSellerCat] = useState(null);

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

    api.get('/category-mains')
      .then((res) => setCategoryMains(res.data.data || []))
      .catch(() => setCategoryMains([]));

    recommendationService.getLocationBasedRecommendations(20)
      .then((data) => setLocationBasedRecs(data || []))
      .catch(() => setLocationBasedRecs([]));

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

  const normFeatured = useMemo(() => featured.map(normalizeProduct).filter(Boolean), [featured]);
  const normBest = useMemo(() => bestSellers.map(normalizeProduct).filter(Boolean), [bestSellers]);
  const normNew = useMemo(() => newArrivals.map(normalizeProduct).filter(Boolean), [newArrivals]);
  const normTrending = useMemo(() => trending.map(normalizeProduct).filter(Boolean), [trending]);
  const normPersonal = useMemo(() => personal.map(normalizeProduct).filter(Boolean), [personal]);
  const normRecent = useMemo(() => recent.map(normalizeProduct).filter(Boolean), [recent]);
  const normYouMayNeed = useMemo(() => youMayNeed.map(normalizeProduct).filter(Boolean), [youMayNeed]);
  const normLocationBased = useMemo(() => locationBasedRecs.map(normalizeProduct).filter(Boolean), [locationBasedRecs]);

  const filteredBestSellers = useMemo(() => {
    if (!activeBestSellerCat) return normBest;
    return normBest.filter(p => p.category?.id === activeBestSellerCat || p.category?.name === activeBestSellerCat);
  }, [normBest, activeBestSellerCat]);

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
    <div className="min-h-screen bg-[#fafbfd]">
      
      {/* Hero Banner */}
      {!searchQuery && (
        <section className="relative border-b border-slate-200/80 text-slate-900 bg-white">
          <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4 text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">
                  <Sparkles size={13} /> NIVORA COLLECTION 2026
                </span>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Trải Nghiệm Mua Sắm <span className="text-emerald-600 block sm:inline">Đa Dạng & Cao Cấp</span>
                </h1>
                
                <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
                  Khám phá hàng nghìn sản phẩm chất lượng cao từ Thời trang, Nội thất, Đồ gia dụng, Công nghệ đến Mỹ phẩm chính hãng.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to="/products"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    Mua sắm ngay <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/products"
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Tất cả sản phẩm
                  </Link>
                </div>

                <HeroAISuggestions />
              </div>

              <div className="lg:col-span-5 hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-card aspect-[4/3]">
                  <img
                    src={heroBannerImg}
                    alt="NIVORA Showcase"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {searchQuery ? (
          <section className="py-4 min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
                  Kết quả tìm kiếm
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight uppercase">
                  Từ khóa: "{searchQuery}"
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Tìm thấy {searchResults.length} sản phẩm phù hợp
                </p>
              </div>
            </div>

            {searchLoading ? (
              <ProductGridSkeleton count={10} />
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-600 text-sm font-semibold">
                  Không tìm thấy sản phẩm nào phù hợp với "{searchQuery}".
                </p>
                <p className="text-slate-400 text-xs mt-1 font-normal">
                  Vui lòng thử từ khóa khác hoặc xóa bộ lọc.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* 1. Gợi ý dành riêng cho bạn */}
            <RecommendationSection
              badge="Gợi ý AI"
              badgeColor="indigo"
              title="Dành riêng cho bạn"
              desc="Các mẫu sản phẩm phù hợp được sắp xếp dựa trên sự quan tâm của bạn"
              products={activeRecTab === 0 
                ? (normPersonal.length > 0 ? normPersonal : normFeatured)
                : (normYouMayNeed.length > 0 ? normYouMayNeed : normTrending)
              }
              loading={loading}
              containerClassName="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card"
              headerExtra={
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {['Dành cho bạn', 'Có thể bạn thích'].map((tabLabel, idx) => (
                    <button
                      key={tabLabel}
                      onClick={() => setActiveRecTab(idx)}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        activeRecTab === idx 
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tabLabel}
                    </button>
                  ))}
                </div>
              }
            />

            {/* 2. Sản phẩm bán chạy */}
            <RecommendationSection
              badge="Bán chạy"
              badgeColor="slate"
              title="Sản phẩm bán chạy nhất"
              desc="Những sản phẩm được mua nhiều nhất và nhận phản hồi tích cực"
              products={filteredBestSellers}
              loading={loading}
              containerClassName="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card"
              headerExtra={
                bestSellerCats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setActiveBestSellerCat(null)}
                      className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                        activeBestSellerCat === null
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Tất cả
                    </button>
                    {bestSellerCats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveBestSellerCat(cat.id)}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                          activeBestSellerCat === cat.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )
              }
            />

            {/* 3. Sản phẩm mới ra mắt */}
            <RecommendationSection
              badge="Mới về"
              badgeColor="slate"
              title="Sản phẩm mới ra mắt"
              desc="Bộ sưu tập thiết kế mới cập nhật trong tuần"
              products={normNew}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card"
            />

            {/* 4. Xu hướng mua sắm */}
            <RecommendationSection
              badge="Xu hướng"
              badgeColor="amber"
              title="Xu hướng mua sắm"
              desc="Sản phẩm được tìm kiếm và tương tác nhiều nhất"
              products={normTrending}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card"
            />

            {/* 5. Thịnh hành theo khu vực */}
            <RecommendationSection
              badge="Khu vực"
              badgeColor="slate"
              title="Thịnh hành theo khu vực nhận hàng"
              desc={user ? "Sản phẩm được mua nhiều nhất tại khu vực của bạn" : "Sản phẩm bán chạy trên toàn quốc"}
              products={normLocationBased}
              loading={loading}
              viewAll
              viewAllHref="/products"
              containerClassName="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card"
            />

            {/* 6. Đã xem gần đây */}
            {normRecent.length > 0 && (
              <RecommendationSection
                badge="Lịch sử"
                badgeColor="slate"
                title="Sản phẩm đã xem gần đây"
                desc="Danh sách mặt hàng bạn vừa xem gần đây"
                products={normRecent}
                loading={loading}
                containerClassName="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card"
              />
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Home;
