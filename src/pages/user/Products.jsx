import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, FolderOpen, ArrowRight, Filter, X, Check, Star, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductCard from '../../components/product/ProductCard';
import Pagination from '../../components/common/Pagination';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { categoryMainService } from '../../services/categoryMainService';
import { normalizeProducts } from '../../utils/productNormalizer';
import { useAuth } from '../../context/AuthContext';
import { recommendationService } from '../../services/recommendationService';

/**
 * Products Browse Page.
 * Removes sidebars.
 * Implements Canifa category drill-down UX:
 * - If browsing a main category or nested category with subcategories, renders category grid.
 * - If browsing a leaf category or general view, renders product grid with filters.
 */
const Products = () => {
  const { categoryMainSlug, categorySlug, parentSlug, childSlug, leafSlug } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQueryParam = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState('');

  // Slugs resolution
  const activeCategoryMainSlug = categoryMainSlug || null;
  const activeCategorySlug = leafSlug || childSlug || parentSlug || categorySlug || null;

  // States
  const [categories, setCategories] = useState([]);
  const [categoryMains, setCategoryMains] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCategoryMains, setLoadingCategoryMains] = useState(true);

  const { user } = useAuth();
  const [userRecs, setUserRecs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('recommendation');
  
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Filter States
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  // Search-specific pagination (load-more pattern)
  const [searchPage, setSearchPage] = useState(0);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);

  // URL pagination
  const productPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1') - 1;
    return Math.max(0, p);
  }, [searchParams]);

  const setProductPage = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p + 1));
      return next;
    });
  };

  // Fetch all categories and category mains on mount
  // Fetch all categories, category mains, and dynamic brands on mount
  useEffect(() => {
    setLoadingCategories(true);
    setLoadingCategoryMains(true);

    categoryService.getAll()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));

    categoryMainService.getAll()
      .then((data) => setCategoryMains(data || []))
      .catch(() => setCategoryMains([]))
      .finally(() => setLoadingCategoryMains(false));
  }, []);

  // Fetch personalized recommendations once on mount or user state change
  useEffect(() => {
    recommendationService.getHomepageRecommendations()
      .then((data) => {
        if (data) {
          const combined = [
            ...(data.personal || []),
            ...(data.youMayNeed || [])
          ];
          setUserRecs(combined);
        }
      })
      .catch((err) => {
        console.error("Failed to load user recommendations in Products.jsx", err);
      });
  }, [user]);

  // Sync search inputs
  useEffect(() => {
    setSearchInput(searchQueryParam);
    setSearchPage(0);
    setHasMoreSearch(false);
  }, [searchQueryParam]);

  // Reset filters when changing category or search query
  useEffect(() => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setProductPage(0);
  }, [activeCategoryMainSlug, activeCategorySlug, searchQueryParam]);

  // Fetch breadcrumb hierarchy from API for active category
  useEffect(() => {
    if (!activeCategorySlug) {
      setBreadcrumbs([]);
      return;
    }
    categoryService.getBreadcrumb(activeCategorySlug)
      .then(setBreadcrumbs)
      .catch(() => setBreadcrumbs([]));
  }, [activeCategorySlug]);

  // Resolve current active main and category
  const currentCategoryMain = useMemo(() => {
    if (!activeCategoryMainSlug) return null;
    return categoryMains.find((m) => m.slug === activeCategoryMainSlug);
  }, [activeCategoryMainSlug, categoryMains]);

  const currentCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    return categories.find((c) => c.slug === activeCategorySlug);
  }, [activeCategorySlug, categories]);

  // Resolve subcategories (children) to display in grid
  const childCategories = useMemo(() => {
    const getParentId = (c) => c.parentId !== undefined ? c.parentId : c.parent_id;
    const getCategoryMainId = (c) => c.categoryMainId !== undefined ? c.categoryMainId : c.category_main_id;
    const getIsActive = (c) => c.isActive !== undefined ? !!c.isActive : (c.is_active !== undefined ? !!c.is_active : true);
    const getSortOrder = (c) => {
      if (c.sortOrder !== undefined && c.sortOrder !== null) return Number(c.sortOrder);
      if (c.displayOrder !== undefined && c.displayOrder !== null) return Number(c.displayOrder);
      if (c.display_order !== undefined && c.display_order !== null) return Number(c.display_order);
      return 0;
    };

    if (activeCategorySlug) {
      if (!currentCategory) return [];
      return categories
        .filter((c) => getParentId(c) === currentCategory.id && getIsActive(c))
        .sort((a, b) => getSortOrder(a) - getSortOrder(b));
    } else if (activeCategoryMainSlug) {
      if (!currentCategoryMain) return [];
      return categories
        .filter(
          (c) =>
            getCategoryMainId(c) === currentCategoryMain.id &&
            !getParentId(c) &&
            getIsActive(c)
        )
        .sort((a, b) => getSortOrder(a) - getSortOrder(b));
    }
    return [];
  }, [activeCategoryMainSlug, activeCategorySlug, currentCategory, currentCategoryMain, categories]);

  const hasChildren = childCategories.length > 0;

  // Resolve peer (sibling) categories at the current level
  const peerCategories = useMemo(() => {
    const getParentId = (c) => c.parentId !== undefined ? c.parentId : c.parent_id;
    const getCategoryMainId = (c) => c.categoryMainId !== undefined ? c.categoryMainId : c.category_main_id;
    const getIsActive = (c) => c.isActive !== undefined ? !!c.isActive : (c.is_active !== undefined ? !!c.is_active : true);
    const getSortOrder = (c) => {
      if (c.sortOrder !== undefined && c.sortOrder !== null) return Number(c.sortOrder);
      if (c.displayOrder !== undefined && c.displayOrder !== null) return Number(c.displayOrder);
      if (c.display_order !== undefined && c.display_order !== null) return Number(c.display_order);
      return 0;
    };

    if (currentCategory) {
      const parentId = getParentId(currentCategory);
      if (parentId) {
        // Siblings under the same parent category
        return categories
          .filter((c) => getParentId(c) === parentId && getIsActive(c))
          .sort((a, b) => getSortOrder(a) - getSortOrder(b));
      } else {
        // Level 1 categories under the same categoryMain
        const mainId = getCategoryMainId(currentCategory);
        return categories
          .filter((c) => getCategoryMainId(c) === mainId && !getParentId(c) && getIsActive(c))
          .sort((a, b) => getSortOrder(a) - getSortOrder(b));
      }
    } else {
      // Sibling is the list of all category mains
      const getSortOrderMain = (m) => m.sortOrder ?? m.display_order ?? m.displayOrder ?? 0;
      return [...categoryMains].sort((a, b) => getSortOrderMain(a) - getSortOrderMain(b));
    }
  }, [currentCategory, currentCategoryMain, categories, categoryMains]);

  // ── FETCH PRODUCTS (Unified Search & Browse) ───────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      const isSearch = !!searchQueryParam.trim();
      const isAppend = isSearch && searchPage > 0;

      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoadingProducts(true);
      }

      try {
        let sortField = 'createdAt';
        let sortDir = 'desc';
        if (sortBy === 'price-asc') {
          sortField = 'basePrice';
          sortDir = 'asc';
        } else if (sortBy === 'price-desc') {
          sortField = 'basePrice';
          sortDir = 'desc';
        }

        const currentPageIndex = isSearch ? searchPage : productPage;

        const params = {
          page: currentPageIndex,
          size: 12,
          sortBy: sortField,
          sortDir,
          ...(activeCategorySlug && { categorySlug: activeCategorySlug }),
          ...(activeCategoryMainSlug && !activeCategorySlug && { categoryMainSlug: activeCategoryMainSlug }),
          ...(minPrice && { minPrice: parseFloat(minPrice) }),
          ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
          ...(minRating && { minRating: parseFloat(minRating) }),
        };

        let data;
        if (isSearch) {
          data = await productService.searchPaginated(searchQueryParam.trim(), {
            ...params,
            rerank: true
          });
        } else {
          data = await productService.getAll(params);
        }

        let newProducts = normalizeProducts(data?.content) || [];
        
        if (sortBy === 'recommendation' && userRecs.length > 0 && !isSearch) {
          const recMap = new Map();
          userRecs.forEach((p, idx) => {
            if (p.id) recMap.set(p.id, idx);
            if (p.uuid) recMap.set(p.uuid, idx);
          });
          
          newProducts = [...newProducts].sort((a, b) => {
            const hasA = recMap.has(a.id) || (a.uuid && recMap.has(a.uuid));
            const hasB = recMap.has(b.id) || (b.uuid && recMap.has(b.uuid));
            
            if (hasA && hasB) {
              const idxA = recMap.get(a.id) ?? recMap.get(a.uuid);
              const idxB = recMap.get(b.id) ?? recMap.get(b.uuid);
              return idxA - idxB;
            }
            if (hasA) return -1;
            if (hasB) return 1;
            return 0;
          });
        }
        
        if (isAppend) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }

        setTotalProducts(data?.totalElements || 0);
        setTotalPages(data?.totalPages || 0);

        if (isSearch) {
          setHasMoreSearch(currentPageIndex + 1 < (data?.totalPages || 0));
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        toast.error('Không thể tải danh sách sản phẩm.');
        if (!isAppend) {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(0);
        }
      } finally {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    };

    fetchProducts();
  }, [
    activeCategorySlug,
    activeCategoryMainSlug,
    searchQueryParam,
    sortBy,
    productPage,
    searchPage,
    minPrice,
    maxPrice,
    minRating
  ]);

  // Construct Breadcrumbs array
  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (currentCategoryMain) {
      let path = `/products/${currentCategoryMain.slug}`;
      items.push({ label: currentCategoryMain.name, to: path });

      // Append sequential path categories
      breadcrumbs.forEach((crumb) => {
        path += `/${crumb.slug}`;
        items.push({ label: crumb.name, to: path });
      });
    }
    return items;
  }, [currentCategoryMain, breadcrumbs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchInput.trim()) {
        next.set('search', searchInput);
      } else {
        next.delete('search');
      }
      next.set('page', '1');
      return next;
    });
  };

  // Determine current Page title
  const pageTitle = useMemo(() => {
    if (searchQueryParam.trim()) {
      return '';
    }
    if (currentCategory) {
      return currentCategory.name;
    }
    if (currentCategoryMain) {
      return currentCategoryMain.name;
    }
    return '';
  }, [searchQueryParam, currentCategory, currentCategoryMain]);

  // Determine product details status text
  const totalItemsText = useMemo(() => {
    if (searchQueryParam.trim()) {
      return '';
    }
    if (totalProducts > 0) {
      return '';
    }
    return 'Không tìm thấy sản phẩm nào';
  }, [searchQueryParam, totalProducts]);

  const handleClearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setProductPage(0);
  };

  const getSiblingLink = (sibling) => {
    const isCategoryMain = sibling.parentId === undefined && sibling.categoryMainId === undefined && sibling.parent_id === undefined && sibling.category_main_id === undefined;
    
    // Preserves search params when switching sibling categories
    const searchParamsCopy = new URLSearchParams(location.search);
    searchParamsCopy.set('page', '1');
    const queryString = searchParamsCopy.toString() ? `?${searchParamsCopy.toString()}` : '';

    if (isCategoryMain) {
      return `/products/${sibling.slug}${queryString}`;
    }
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 2) {
      segments[segments.length - 1] = sibling.slug;
      return '/' + segments.join('/') + queryString;
    }
    if (currentCategoryMain) {
      return `/products/${currentCategoryMain.slug}/${sibling.slug}${queryString}`;
    }
    return `/products/${sibling.slug}${queryString}`;
  };

  const renderFilterContent = () => {
    const hasAnyFilter = !!(minPrice || maxPrice || minRating || searchInput.trim() || sortBy !== 'newest');

    return (
      <div className="space-y-6">
        {/* Section: Tìm kiếm */}
        <div className="border-b border-gray-100 pb-5">
          <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-widest mb-3">
            Tìm kiếm sản phẩm
          </h4>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs outline-none w-full transition-all font-semibold placeholder-gray-400 text-gray-750"
            />
            <button
              type="submit"
              className="absolute right-3 text-gray-450 hover:text-emerald-600 transition-colors"
            >
              <Search size={14} />
            </button>
          </form>
        </div>

        {/* Section: Sắp xếp */}
        <div className="border-b border-gray-100 pb-5">
          <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-widest mb-3">
            Sắp xếp theo
          </h4>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:bg-white transition-all w-full">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setProductPage(0);
              }}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none w-full cursor-pointer"
            >
              <option value="recommendation">Gợi ý cho bạn (AI)</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá thấp → cao</option>
              <option value="price-desc">Giá cao → thấp</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {hasAnyFilter && (
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              Đang áp dụng bộ lọc
            </span>
            <button
              onClick={() => {
                handleClearAllFilters();
                setSearchInput('');
                setSortBy('newest');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('search');
                  next.set('page', '1');
                  return next;
                });
              }}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <RotateCcw size={10} />
              Xóa lọc
            </button>
          </div>
        )}

        {/* Section 1: Danh mục liên quan */}
        {peerCategories.length > 0 && (
          <div className="border-b border-gray-100 pb-5">
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-widest mb-3 flex items-center justify-between">
              Danh mục
            </h4>
            <div className="space-y-2 pr-1">
              {(isCategoriesExpanded ? peerCategories : peerCategories.slice(0, 5)).map((sibling) => {
                const isActive = activeCategorySlug === sibling.slug || (!activeCategorySlug && currentCategoryMain?.slug === sibling.slug);
                return (
                  <Link
                    key={sibling.id}
                    to={getSiblingLink(sibling)}
                    className={`block text-xs py-1 transition-all ${
                      isActive
                        ? 'text-emerald-600 font-bold translate-x-1'
                        : 'text-gray-600 hover:text-emerald-600 hover:translate-x-0.5'
                    }`}
                  >
                    {sibling.name}
                  </Link>
                );
              })}
              {peerCategories.length > 5 && (
                <button
                  type="button"
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 mt-2 block uppercase tracking-wider cursor-pointer text-left"
                >
                  {isCategoriesExpanded ? 'Thu gọn' : `Xem thêm (${peerCategories.length - 5})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section 2: Khoảng giá */}
        <div className="border-b border-gray-100 pb-5">
          <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-widest mb-3">
            Khoảng giá (VND)
          </h4>
          
          {/* Quick Price Filters */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[
              { label: 'Dưới 200k', min: '', max: '200000' },
              { label: '200k - 500k', min: '200000', max: '500000' },
              { label: '500k - 1M', min: '500000', max: '1000000' },
              { label: 'Trên 1M', min: '1000000', max: '' },
            ].map((p) => {
              const isActive = minPrice === p.min && maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setMinPrice('');
                      setMaxPrice('');
                    } else {
                      setMinPrice(p.min);
                      setMaxPrice(p.max);
                    }
                    setProductPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Price Inputs */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setProductPage(0);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 rounded-xl text-xs outline-none text-gray-700 font-semibold"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setProductPage(0);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 rounded-xl text-xs outline-none text-gray-700 font-semibold"
            />
          </div>
        </div>

        {/* Section 3: Đánh giá */}
        <div>
          <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-widest mb-3">
            Đánh giá sản phẩm
          </h4>
          <div className="space-y-2">
            {[5, 4, 3].map((stars) => {
              const isActive = minRating === String(stars);
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => {
                    setMinRating(isActive ? '' : String(stars));
                    setProductPage(0);
                  }}
                  className={`w-full flex items-center justify-between text-xs text-gray-600 p-2 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-250 text-emerald-700 font-bold'
                      : 'bg-transparent border-transparent hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                      />
                    ))}
                    <span className="ml-1 text-[11px]">
                      {stars === 5 ? 'Tuyệt đối' : 'trở lên'}
                    </span>
                  </div>
                  {isActive && <Check size={12} className="text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const showSkeleton = loadingProducts && (searchQueryParam.trim() ? searchPage === 0 : true);

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col">
      {/* ── BREADCRUMBS BAR (Edge-to-edge container) ── */}
      <div className="w-full py-4 mb-2">
        <div className="max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6 pb-16 flex-grow">
        
        {/* Sleek Page Header (Plain text, no bulky card) */}
        <div className="flex items-center justify-between mb-6 px-1 lg:hidden">
          <div />

          {/* Mobile Search & Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all text-xs font-bold text-gray-700 cursor-pointer shadow-sm"
          >
            <Filter size={14} className="text-emerald-600" />
            <span>Tìm kiếm & Bộ lọc</span>
            {(minPrice || maxPrice || minRating || searchInput.trim() || sortBy !== 'newest') && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* ── DRILL-DOWN CATEGORY GRID VIEW (When category has subcategories or loading) ── */}
        {!searchQueryParam.trim() && (activeCategoryMainSlug || activeCategorySlug) && (
          <div className="mb-10">
            {loadingCategories ? (
              <>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 animate-pulse">
                  Đang tải danh mục...
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-24 bg-gray-100 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </>
            ) : (
              hasChildren && (
                <>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Danh mục con
                  </h3>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {childCategories.map((child, index) => {
                      const linkTo = location.pathname.endsWith('/')
                        ? `${location.pathname}${child.slug}`
                        : `${location.pathname}/${child.slug}`;

                      return (
                        <motion.div
                          key={child.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02, duration: 0.2 }}
                        >
                          <Link
                            to={linkTo}
                            className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-emerald-50/50 border border-gray-200/80 hover:border-emerald-300 rounded-full text-xs font-bold text-gray-700 hover:text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer uppercase tracking-wider"
                          >
                            {child.name}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* ── TWO-COLUMN SPLIT LAYOUT FOR SIDEBAR & PRODUCTS ── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Sticky Sidebar Filter */}
          <aside className="hidden lg:block w-64 lg:w-72 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-32 max-h-[calc(100vh-160px)] overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
                <Filter className="text-emerald-600" size={16} />
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                  Bộ lọc sản phẩm
                </h3>
              </div>
              {renderFilterContent()}
            </div>
          </aside>

          {/* Right Column: Products Display Area */}
          <div className="flex-1 min-w-0">
            {/* ── PRODUCT GRID VIEW ── */}
            <div>
              {!searchQueryParam.trim() && (activeCategoryMainSlug || activeCategorySlug) && !loadingCategories && hasChildren && (
                <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest mb-6 border-t border-gray-100 pt-8">
                  Danh sách sản phẩm
                </h3>
              )}

              {showSkeleton ? (
                /* Skeleton Grid matching the responsive column specs */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] bg-white border border-gray-100 rounded-3xl animate-pulse p-4 flex flex-col justify-end gap-3"
                    >
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm text-center mb-8">
                  <FolderOpen className="text-gray-300 w-12 h-12 mx-auto mb-3 stroke-[1.5]" />
                  <p className="text-gray-500 font-bold text-sm">Không tìm thấy sản phẩm nào phù hợp.</p>
                </div>
              ) : (
                <>
                  {/* Responsive Grid: 5-6 columns desktop, down to 2 columns on mobile */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination or See More button */}
                  {searchQueryParam.trim() ? (
                    hasMoreSearch && (
                      <div className="flex justify-center mt-6 mb-8">
                        <button
                          type="button"
                          disabled={loadingMore}
                          onClick={() => setSearchPage(prev => prev + 1)}
                          className="cursor-pointer inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Đang tải...
                            </>
                          ) : (
                            <>
                              Xem thêm sản phẩm
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    )
                  ) : (
                    totalPages > 1 && (
                      <div className="flex justify-center mt-4 mb-8">
                        <Pagination
                          currentPage={productPage + 1}
                          totalPages={totalPages}
                          onPageChange={(p) => setProductPage(p - 1)}
                        />
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── MOBILE FILTER DRAWER OVERLAY ── */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              className="relative w-80 max-w-full h-full bg-white shadow-2xl flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="text-emerald-600" size={16} />
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Bộ lọc sản phẩm
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 space-y-6">
                {renderFilterContent()}
              </div>

              {/* Footer Buttons */}
              <div className="border-t border-gray-100 pt-4 mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleClearAllFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl transition-all cursor-pointer"
                >
                  Xóa tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
