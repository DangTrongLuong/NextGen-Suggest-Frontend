import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Home, ChevronLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductCard from '../../components/product/ProductCard';
import Pagination from '../../components/common/Pagination';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { categoryMainService } from '../../services/categoryMainService';
import { normalizeProducts } from '../../utils/productNormalizer';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get('category') || null;
  const selectedCategoryMainSlug = searchParams.get('categoryMain') || null;
  const searchQueryParam = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [categoryMains, setCategoryMains] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCategoryMains, setLoadingCategoryMains] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  // Search-specific pagination (load-more pattern, not URL-based)
  const [searchPage, setSearchPage] = useState(0);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);

  // States for Category Search
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [expandedMainIds, setExpandedMainIds] = useState([]);

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Fetch all categories and category mains once
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

  // Debounce Category Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setCategorySearchQuery(categorySearchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [categorySearchInput]);

  // Auto-expand CategoryMain if its slug is selected in URL
  useEffect(() => {
    if (selectedCategoryMainSlug && categoryMains.length > 0) {
      const selectedMain = categoryMains.find((cm) => cm.slug === selectedCategoryMainSlug);
      if (selectedMain && !expandedMainIds.includes(selectedMain.id)) {
        setExpandedMainIds((prev) => [...prev, selectedMain.id]);
      }
    }
  }, [selectedCategoryMainSlug, categoryMains]);

  // If a sub-category is selected, auto-expand its CategoryMain
  useEffect(() => {
    if (selectedCategorySlug && categories.length > 0 && categoryMains.length > 0) {
      const selectedCat = categories.find((c) => c.slug === selectedCategorySlug);
      if (selectedCat && selectedCat.categoryMainId) {
        if (!expandedMainIds.includes(selectedCat.categoryMainId)) {
          setExpandedMainIds((prev) => [...prev, selectedCat.categoryMainId]);
        }
      }
    }
  }, [selectedCategorySlug, categories, categoryMains]);

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
          ...(selectedCategoryMainSlug && { categoryMainSlug: selectedCategoryMainSlug }),
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
  }, [selectedCategorySlug, selectedCategoryMainSlug, searchQueryParam, sortBy, productPage]);

  // Filter Categories Helper
  const currentCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return categories.find((c) => c.slug === selectedCategorySlug);
  }, [selectedCategorySlug, categories]);

  const handleSelectCategoryMain = (slug) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) {
        next.set('categoryMain', slug);
        next.delete('category');
      } else {
        next.delete('categoryMain');
      }
      next.set('page', '1');
      return next;
    });
    setIsMobileSidebarOpen(false);
  };

  const handleSelectCategory = (slug) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) {
        next.set('category', slug);
        next.delete('categoryMain');
      } else {
        next.delete('category');
      }
      next.set('page', '1');
      return next;
    });
    setIsMobileSidebarOpen(false);
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

  const toggleExpandMain = (mainId) => {
    setExpandedMainIds((prev) =>
      prev.includes(mainId) ? prev.filter((id) => id !== mainId) : [...prev, mainId]
    );
  };

  const getCategoriesForMain = (mainId) => {
    return categories.filter((c) => c.categoryMainId === mainId);
  };

  const filteredCategoryMains = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoryMains;
    const query = categorySearchQuery.toLowerCase();
    return categoryMains.filter((main) => {
      const matchMain = main.name.toLowerCase().includes(query) || (main.slug || '').toLowerCase().includes(query);
      const hasMatchingChild = categories.some(
        (c) => c.categoryMainId === main.id && (c.name.toLowerCase().includes(query) || (c.slug || '').toLowerCase().includes(query))
      );
      return matchMain || hasMatchingChild;
    });
  }, [categoryMains, categories, categorySearchQuery]);

  // Only show skeleton on first page of search (not when appending more)
  const showSkeleton = loadingProducts && (searchQueryParam.trim() ? searchPage === 0 : true);

  const renderSidebarContent = () => (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
          Danh mục
        </h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Khám phá các sản phẩm theo danh mục</p>
      </div>

      {/* Category Search box */}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Tìm nhanh danh mục..."
          value={categorySearchInput}
          onChange={(e) => setCategorySearchInput(e.target.value)}
          className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-450 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs outline-none transition-all font-semibold placeholder-gray-400 text-gray-750"
        />
        <Search size={13} className="absolute right-3 text-gray-450" />
      </div>

      {/* Category mains list */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('category');
              next.delete('categoryMain');
              next.set('page', '1');
              return next;
            });
            setIsMobileSidebarOpen(false);
          }}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left transition-all cursor-pointer text-sm ${
            !selectedCategorySlug && !selectedCategoryMainSlug
              ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/10'
              : 'text-gray-700 hover:bg-gray-50 font-semibold hover:text-emerald-600'
          }`}
        >
          <span className="text-sm flex-shrink-0">🏷️</span>
          <span className="truncate">Tất cả sản phẩm</span>
        </button>

        {loadingCategoryMains || loadingCategories ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-xl" />
          ))
        ) : filteredCategoryMains.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium text-center py-4">Không tìm thấy danh mục chính.</p>
        ) : (
          filteredCategoryMains.map((main) => {
            const isExpanded = expandedMainIds.includes(main.id);
            const isSelected = main.slug === selectedCategoryMainSlug;
            const subCats = getCategoriesForMain(main.id);

            return (
              <div key={main.id} className="flex flex-col">
                <div className="flex items-center justify-between w-full rounded-xl transition-all hover:bg-gray-50 group">
                  <button
                    onClick={() => handleSelectCategoryMain(main.slug)}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all group cursor-pointer text-sm ${
                      isSelected
                        ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/10'
                        : isExpanded
                        ? 'bg-emerald-50/80 text-emerald-800 font-bold border border-emerald-100/50'
                        : 'text-gray-750 font-semibold hover:text-emerald-600'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-gray-55 flex-shrink-0 flex items-center justify-center text-xs font-semibold">
                      {main.imageUrl ? (
                        <img src={main.imageUrl} alt={main.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <span className="truncate">
                      {main.name}
                    </span>
                  </button>
                  {subCats.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandMain(main.id);
                      }}
                      className={`p-2 rounded-xl hover:bg-gray-200/55 transition-colors ${
                        isSelected ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600'
                      }`}
                    >
                      <ChevronRight
                        size={13}
                        className={`transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Subcategories (accordion-style) */}
                {isExpanded && subCats.length > 0 && (
                  <div className="pl-6 pr-2 py-1 mt-1 mb-1 border-l-2 border-emerald-100 flex flex-col gap-0.5">
                    {subCats.map((child) => {
                      const isChildSelected = child.slug === selectedCategorySlug;
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleSelectCategory(child.slug)}
                          className={`w-full px-2 py-1 rounded-lg text-left text-[13px] font-semibold transition-all cursor-pointer ${
                            isChildSelected
                              ? 'text-emerald-600 bg-emerald-50/50 font-bold'
                              : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50/30'
                          }`}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      
      {/* ── BREADCRUMB (Edge-to-edge) ── */}
      <div className="w-full bg-white border-b border-gray-100 shadow-sm py-4 mb-6">
        <div className="max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6 flex items-center justify-between">
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
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6 pb-16 flex-grow">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LEFT SIDEBAR (Desktop only) */}
          <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
              {renderSidebarContent()}
            </div>
          </aside>

          {/* MOBILE TOGGLE & COLLAPSED ACCORDION (Mobile only) */}
          <div className="md:hidden mb-6">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm text-xs font-bold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                 Danh mục sản phẩm
              </span>
              <motion.span
                animate={{ rotate: isMobileSidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={16} />
              </motion.span>
            </button>
            
            {isMobileSidebarOpen && (
              <div className="mt-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                {renderSidebarContent()}
              </div>
            )}
          </div>

          {/* RIGHT PRODUCT HUB & GRID */}
          <main className="flex-1 min-w-0">
            
            {/* Title & Filter Bar */}
            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  {searchQueryParam.trim()
                    ? `Kết quả tìm kiếm: "${searchQueryParam.trim()}"`
                    : selectedCategoryMainSlug
                    ? (categoryMains.find(cm => cm.slug === selectedCategoryMainSlug)?.name || 'Danh mục chính')
                    : currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-semibold">
                  {searchQueryParam.trim() ? (
                    <>
                      Tìm thấy <span className="text-emerald-600 font-semibold">{totalProducts}</span> sản phẩm phù hợp
                      <span className="inline-flex items-center gap-1 ml-2 text-emerald-600 font-semibold">
                        <Sparkles size={11} /> Tìm kiếm thông minh
                      </span>
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
                    className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs outline-none w-full sm:w-56 transition-all font-semibold placeholder-gray-400 text-gray-750"
                  />
                  <button type="submit" className="absolute right-3 text-gray-400 hover:text-emerald-600 transition-colors">
                    <Search size={14} />
                  </button>
                </form>

                {/* Sort Dropdown */}
                {!searchQueryParam.trim() && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:bg-white transition-all">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-bold text-gray-700 outline-none pr-6 cursor-pointer"
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="price-asc">Giá thấp → cao</option>
                      <option value="price-desc">Giá cao → thấp</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* Products Grid */}
            {showSkeleton ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 mb-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white border border-gray-100 rounded-2xl animate-pulse p-3 flex flex-col justify-end gap-2.5">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm text-center mb-8">
                <p className="text-gray-450 font-semibold text-xs">Không tìm thấy sản phẩm nào phù hợp.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 mb-8">
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
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white text-xs font-bold rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer"
                    >
                      {loadingMore ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang tải thêm...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
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
            
          </main>

        </div>
      </div>

    </div>
  );
};

export default Products;
