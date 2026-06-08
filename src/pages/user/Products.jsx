import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Home, ChevronLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductCard from '../../components/product/ProductCard';
import Pagination from '../../components/common/Pagination';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { normalizeProducts } from '../../utils/productNormalizer';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get('category') || null;
  const searchQueryParam = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [categoryPage, setCategoryPage] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  // Search-specific pagination (load-more pattern, not URL-based)
  const [searchPage, setSearchPage] = useState(0);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);

  // States for Category Pagination & Search
  const [paginatedParentCategories, setPaginatedParentCategories] = useState([]);
  const [loadingParentCategories, setLoadingParentCategories] = useState(true);
  const [totalCatPages, setTotalCatPages] = useState(0);
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

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

  // Fetch all categories once (for context/lookup/breadcrumbs)
  useEffect(() => {
    setLoadingCategories(true);
    categoryService.getAll()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Debounce Category Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setCategorySearchQuery(categorySearchInput);
      setCategoryPage(0); // Reset page to 0 when search query changes
    }, 300);
    return () => clearTimeout(handler);
  }, [categorySearchInput]);

  // Fetch paginated parent categories
  useEffect(() => {
    if (selectedCategorySlug) return;

    const fetchParentCats = async () => {
      setLoadingParentCategories(true);
      try {
        const data = await categoryService.getPaginated({
          page: categoryPage,
          size: 12,
          parentOnly: true,
          search: categorySearchQuery.trim() || undefined
        });
        setPaginatedParentCategories(data?.content || []);
        setTotalCatPages(data?.totalPages || 0);
      } catch (err) {
        console.error('Failed to fetch paginated parent categories:', err);
        setPaginatedParentCategories([]);
        setTotalCatPages(0);
      } finally {
        setLoadingParentCategories(false);
      }
    };

    fetchParentCats();
  }, [categoryPage, categorySearchQuery, selectedCategorySlug]);

  // Sync search input with URL param + reset search pagination on new query
  useEffect(() => {
    setSearchInput(searchQueryParam);
    setSearchPage(0);
    setHasMoreSearch(false);
  }, [searchQueryParam]);

  // Fetch breadcrumb hierarchy whenever active category changes
  useEffect(() => {
    if (!selectedCategorySlug) {
      setBreadcrumbs([]);
      return;
    }
    categoryService.getBreadcrumb(selectedCategorySlug)
      .then(setBreadcrumbs)
      .catch(() => setBreadcrumbs([]));
  }, [selectedCategorySlug]);

  // ── SEARCH: Load-more pattern (not URL-based) ───────────────────────────
  useEffect(() => {
    if (!searchQueryParam.trim()) return;

    const fetchSearch = async () => {
      if (searchPage === 0) {
        setLoadingProducts(true);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }
      try {
        const data = await productService.searchPaginated(searchQueryParam.trim(), {
          page: searchPage,
          size: 12,
          rerank: true,
        });
        const newProducts = normalizeProducts(data?.content) || [];
        if (searchPage === 0) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }
        setTotalProducts(data?.totalElements || 0);
        setHasMoreSearch(!data?.last);
      } catch (err) {
        console.error('Search failed:', err);
        toast.error('Không thể tìm kiếm sản phẩm. Vui lòng thử lại.');
      } finally {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    };

    fetchSearch();
  }, [searchQueryParam, searchPage]);

  // ── BROWSE: Standard pagination (URL-based) ──────────────────────────────
  useEffect(() => {
    if (searchQueryParam.trim()) return;

    const fetchBrowse = async () => {
      setLoadingProducts(true);
      try {
        let sortField = 'createdAt';
        let sortDir = 'desc';
        if (sortBy === 'price-asc') { sortField = 'basePrice'; sortDir = 'asc'; }
        else if (sortBy === 'price-desc') { sortField = 'basePrice'; sortDir = 'desc'; }

        const params = {
          page: productPage,
          size: 12,
          sortBy: sortField,
          sortDir,
          ...(selectedCategorySlug && { categorySlug: selectedCategorySlug }),
        };

        const data = await productService.getAll(params);
        setProducts(normalizeProducts(data?.content) || []);
        setTotalProducts(data?.totalElements || 0);
        setTotalPages(data?.totalPages || 0);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        toast.error('Không thể tải sản phẩm.');
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchBrowse();
  }, [selectedCategorySlug, searchQueryParam, sortBy, productPage]);

  // Filter Categories Helper
  const currentCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return categories.find((c) => c.slug === selectedCategorySlug);
  }, [selectedCategorySlug, categories]);

  const childCategories = useMemo(() => {
    if (!currentCategory) return [];
    return categories.filter((c) => c.parentId === currentCategory.id);
  }, [currentCategory, categories]);

  const handleSelectCategory = (slug) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) {
        next.set('category', slug);
      } else {
        next.delete('category');
      }
      next.set('page', '1');
      return next;
    });
  };

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

  // Only show skeleton on first page of search (not when appending more)
  const showSkeleton = loadingProducts && (searchQueryParam.trim() ? searchPage === 0 : true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen bg-gray-50/50">
      
      {/* ── BREADCRUMB ── */}
      <div className="mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Link to="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <Home size={15} /> Trang chủ
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <button onClick={() => handleSelectCategory(null)} className={`hover:text-emerald-600 transition-colors ${!selectedCategorySlug ? 'text-gray-900 font-semibold' : ''}`}>
            Danh mục
          </button>
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={crumb.slug} className="flex items-center gap-2">
                <ChevronRight size={14} className="text-gray-300" />
                {isLast ? (
                  <span className="text-gray-900 font-bold">{crumb.name}</span>
                ) : (
                  <button onClick={() => handleSelectCategory(crumb.slug)} className="hover:text-emerald-600 transition-colors">
                    {crumb.name}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* ── MAIN PARENT CATEGORIES GRID (HUB VIEW) ── */}
      {!selectedCategorySlug && (
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-100 pb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Khám phá Danh mục chính</h2>
              <p className="text-sm text-gray-500 mt-1">Duyệt sản phẩm theo các nhóm danh mục chính của chúng tôi</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Category search box */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm danh mục..."
                  value={categorySearchInput}
                  onChange={(e) => setCategorySearchInput(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs outline-none w-48 sm:w-56 transition-all font-medium placeholder-gray-400"
                />
                <Search size={14} className="absolute right-3 text-gray-400" />
              </div>

              {/* Category pagination controls */}
              {totalCatPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={categoryPage === 0}
                    onClick={() => setCategoryPage(p => Math.max(0, p - 1))}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-gray-500 font-semibold">
                    Trang {categoryPage + 1} / {totalCatPages}
                  </span>
                  <button
                    disabled={categoryPage >= totalCatPages - 1}
                    onClick={() => setCategoryPage(p => Math.min(totalCatPages - 1, p + 1))}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {loadingParentCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : paginatedParentCategories.length === 0 ? (
            <p className="text-center text-gray-400 py-10 font-medium">Không tìm thấy danh mục nào.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedParentCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectCategory(cat.slug)}
                  className="flex flex-col items-center p-3 rounded-2xl border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all duration-300 bg-white group cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2 flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                        <span className="text-4xl">{cat.icon || '📦'}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-600 transition-colors text-center line-clamp-1">
                    {cat.name}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CHILD CATEGORIES PILLS BAR ── */}
      {selectedCategorySlug && childCategories.length > 0 && (
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex-shrink-0">Danh mục con:</span>
            {childCategories.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelectCategory(child.slug)}
                className="px-4 py-2 rounded-full border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 text-xs font-bold transition-all flex-shrink-0 cursor-pointer"
              >
                {child.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── PRODUCT HUB TITLE & FILTER BAR ── */}
      <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            {searchQueryParam.trim()
              ? `Kết quả tìm kiếm: "${searchQueryParam.trim()}"`
              : currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {searchQueryParam.trim() ? (
              <>
                {/* Tìm thấy <span className="text-emerald-600 font-semibold">{totalProducts}</span> sản phẩm phù hợp
                <span className="inline-flex items-center gap-1 ml-2 text-emerald-600 font-semibold">
                  <Sparkles size={12} /> Tìm kiếm thông minh
                </span> */}
              </>
            ) : (
              <>
                Có <span className="text-emerald-600 font-semibold">{totalProducts}</span> sản phẩm phù hợp
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm thông minh..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none w-full sm:w-60 transition-all font-medium placeholder-gray-400"
            />
            <button type="submit" className="absolute right-3 text-gray-400 hover:text-emerald-600 transition-colors">
              <Search size={16} />
            </button>
          </form>

          {/* Sort Dropdown — hidden during semantic search (relevance order) */}
          {!searchQueryParam.trim() && (
            <div className="flex items-center gap-2 bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:bg-white transition-all">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none pr-6 cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ── PRODUCTS LISTING GRID ── */}
      {showSkeleton ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-white border border-gray-100 rounded-2xl animate-pulse p-3 flex flex-col justify-end gap-2.5">
              <div className="h-3.5 bg-gray-200 rounded w-2/3" />
              <div className="h-3.5 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm text-center mb-8">
          <p className="text-gray-400 font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Search: Xem thêm (Load More) button */}
          {searchQueryParam.trim() && hasMoreSearch && (
            <div className="flex justify-center mt-2 mb-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSearchPage((prev) => prev + 1)}
                disabled={loadingMore}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tải thêm...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Xem thêm sản phẩm
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Browse: Standard Pagination */}
          {!searchQueryParam.trim() && totalPages > 1 && (
            <div className="flex justify-center mt-4 mb-8">
              <Pagination
                currentPage={productPage + 1}
                totalPages={totalPages}
                onPageChange={(p) => setProductPage(p - 1)}
              />
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Products;
