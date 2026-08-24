import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderOpen, ArrowRight, Filter, X, Check, Star, RotateCcw } from 'lucide-react';
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

const Products = () => {
  const { categoryMainSlug, categorySlug, parentSlug, childSlug, leafSlug } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQueryParam = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState('');

  const activeCategoryMainSlug = categoryMainSlug || null;
  const activeCategorySlug = leafSlug || childSlug || parentSlug || categorySlug || null;

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

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  const [searchPage, setSearchPage] = useState(0);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);

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

  useEffect(() => {
    setSearchInput(searchQueryParam);
    setSearchPage(0);
    setHasMoreSearch(false);
  }, [searchQueryParam]);

  useEffect(() => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setProductPage(0);
    setSearchPage(0);
  }, [activeCategoryMainSlug, activeCategorySlug, searchQueryParam]);

  useEffect(() => {
    if (!activeCategorySlug) {
      setBreadcrumbs([]);
      return;
    }
    categoryService.getBreadcrumb(activeCategorySlug)
      .then(setBreadcrumbs)
      .catch(() => setBreadcrumbs([]));
  }, [activeCategorySlug]);

  const currentCategoryMain = useMemo(() => {
    if (!activeCategoryMainSlug) return null;
    return categoryMains.find((m) => m.slug === activeCategoryMainSlug);
  }, [activeCategoryMainSlug, categoryMains]);

  const currentCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    return categories.find((c) => c.slug === activeCategorySlug);
  }, [activeCategorySlug, categories]);

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
        return categories
          .filter((c) => getParentId(c) === parentId && getIsActive(c))
          .sort((a, b) => getSortOrder(a) - getSortOrder(b));
      } else {
        const mainId = getCategoryMainId(currentCategory);
        return categories
          .filter((c) => getCategoryMainId(c) === mainId && !getParentId(c) && getIsActive(c))
          .sort((a, b) => getSortOrder(a) - getSortOrder(b));
      }
    } else {
      const getSortOrderMain = (m) => m.sortOrder ?? m.display_order ?? m.displayOrder ?? 0;
      return [...categoryMains].sort((a, b) => getSortOrderMain(a) - getSortOrderMain(b));
    }
  }, [currentCategory, currentCategoryMain, categories, categoryMains]);

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
          size: 10,
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

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (currentCategoryMain) {
      let path = `/products/${currentCategoryMain.slug}`;
      items.push({ label: currentCategoryMain.name, to: path });

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

  const handleClearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setProductPage(0);
  };

  const getSiblingLink = (sibling) => {
    const isCategoryMain = sibling.parentId === undefined && sibling.categoryMainId === undefined && sibling.parent_id === undefined && sibling.category_main_id === undefined;
    
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
    const hasAnyFilter = !!(minPrice || maxPrice || minRating || searchInput.trim() || sortBy !== 'recommendation');

    return (
      <div className="space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2">
            Tìm kiếm
          </h4>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Từ khóa tìm kiếm..."
              value={searchInput}
              maxLength={100}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 rounded-lg text-xs outline-none w-full transition-colors font-medium text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              className="absolute right-2.5 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <Search size={14} />
            </button>
          </form>
        </div>

        <div className="border-b border-slate-100 pb-4">
          <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2">
            Sắp xếp theo
          </h4>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setProductPage(0);
            }}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-3 py-2 outline-none w-full cursor-pointer focus:border-slate-900"
          >
            <option value="recommendation">Gợi ý AI</option>
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá: Thấp → Cao</option>
            <option value="price-desc">Giá: Cao → Thấp</option>
          </select>
        </div>

        {hasAnyFilter && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Bộ lọc đang áp dụng
            </span>
            <button
              onClick={() => {
                handleClearAllFilters();
                setSearchInput('');
                setSortBy('recommendation');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('search');
                  next.set('page', '1');
                  return next;
                });
              }}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <RotateCcw size={10} />
              Xóa
            </button>
          </div>
        )}

        {peerCategories.length > 0 && (
          <div className="border-b border-slate-100 pb-4">
            <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2">
              Danh mục
            </h4>
            <div className="space-y-1.5">
              {(isCategoriesExpanded ? peerCategories : peerCategories.slice(0, 5)).map((sibling) => {
                const isActive = activeCategorySlug === sibling.slug || (!activeCategorySlug && currentCategoryMain?.slug === sibling.slug);
                return (
                  <Link
                    key={sibling.id}
                    to={getSiblingLink(sibling)}
                    className={`block text-xs py-1 transition-all ${
                      isActive
                        ? 'text-slate-900 font-bold translate-x-0.5'
                        : 'text-slate-600 hover:text-slate-900'
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
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 mt-1 block uppercase tracking-wider cursor-pointer text-left"
                >
                  {isCategoriesExpanded ? 'Thu gọn' : `Xem thêm (${peerCategories.length - 5})`}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="border-b border-slate-100 pb-4">
          <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2">
            Khoảng giá (VND)
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Từ"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setProductPage(0); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-lg outline-none focus:border-slate-900 font-medium"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Đến"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setProductPage(0); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-lg outline-none focus:border-slate-900 font-medium"
            />
          </div>
        </div>

        <div>
          <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2">
            Đánh giá
          </h4>
          <div className="space-y-1">
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
                  className={`w-full flex items-center justify-between text-xs text-slate-600 p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                    <span className="ml-1 text-[11px]">trở lên</span>
                  </div>
                  {isActive && <Check size={12} className="text-slate-900" />}
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
    <div className="min-h-screen bg-[#fafbfd] flex flex-col pt-4">
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto w-full px-4 sm:px-6 mb-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="max-w-[96%] xl:max-w-[92%] mx-auto w-full px-4 sm:px-6 pb-16 flex-grow">
        
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div />
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 cursor-pointer shadow-xs"
          >
            <Filter size={14} className="text-slate-700" />
            <span>Bộ lọc</span>
          </button>
        </div>

        {!searchQueryParam.trim() && (activeCategoryMainSlug || activeCategorySlug) && (
          <div className="mb-8">
            {!loadingCategories && hasChildren && (
              <>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Danh mục con
                </h3>
                <div className="flex flex-wrap gap-2">
                  {childCategories.map((child) => {
                    const linkTo = location.pathname.endsWith('/')
                      ? `${location.pathname}${child.slug}`
                      : `${location.pathname}/${child.slug}`;

                    return (
                      <Link
                        key={child.id}
                        to={linkTo}
                        className="inline-flex items-center px-3.5 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors shadow-xs uppercase tracking-wider"
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card sticky top-32 max-h-[calc(100vh-160px)] overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Filter className="text-slate-900" size={15} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Bộ lọc sản phẩm
                </h3>
              </div>
              {renderFilterContent()}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div>
              {showSkeleton ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-white border border-slate-200 rounded-xl animate-pulse p-4" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-card text-center mb-8">
                  <FolderOpen className="text-slate-300 w-10 h-10 mx-auto mb-2" />
                  <p className="text-slate-800 font-bold text-xs">
                    {searchQueryParam.trim()
                      ? `Không tìm thấy sản phẩm nào với từ khóa "${searchQueryParam.trim()}".`
                      : "Không có sản phẩm nào."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {searchQueryParam.trim() ? (
                    hasMoreSearch && (
                      <div className="flex justify-center mt-6 mb-8">
                        <button
                          type="button"
                          disabled={loadingMore}
                          onClick={() => setSearchPage(prev => prev + 1)}
                          className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50"
                        >
                          {loadingMore ? 'Đang tải...' : 'Xem thêm sản phẩm'}
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

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="relative z-10 w-80 max-w-[85%] h-full bg-white shadow-2xl flex flex-col p-5 overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="text-slate-900" size={15} />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Bộ lọc
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  {renderFilterContent()}
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleClearAllFilters();
                      setIsMobileFilterOpen(false);
                    }}
                    className="flex-1 py-2.5 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Products;
