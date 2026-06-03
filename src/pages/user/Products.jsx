import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductGrid from '../../components/product/ProductGrid';
import ProductFilter from '../../components/product/ProductFilter';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Pagination from '../../components/common/Pagination';
import { useProducts } from '../../context/ProductContext';
import { SORT_OPTIONS } from '../../utils/constants';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    filteredProducts, loading, filters, sortBy, totalProducts, totalPages,
    page, updateFilter, setSortBy, setPage,
  } = useProducts();

  // Sync URL params → filters on query changes
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    updateFilter('search', search);
    if (category !== 'All') {
      const catName = category.charAt(0).toUpperCase() + category.slice(1);
      updateFilter('category', catName);
    } else {
      updateFilter('category', 'All');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [filterOpen, setFilterOpen] = [
    false,
    () => {},
  ];

  // Local state for mobile drawer
  const [mobileFilterOpen, setMobileFilterOpen] = [false, () => {}];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen bg-white">
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-6 pb-3 border-b border-gray-100">
        <div className="mb-4">
          <Breadcrumb items={[{ label: 'Sản phẩm', to: '/products' }]} />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Tất cả sản phẩm</h1>
            <p className="text-gray-500 text-sm mt-1">
              <span className="text-emerald-600 font-semibold">{totalProducts}</span> sản phẩm
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="hidden sm:block px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <MobileFilterButton />
          </div>
        </div>

        {/* Active filter chips */}
        {(filters.category !== 'All' || filters.search || filters.minPrice || filters.maxPrice || filters.minRating) && (
          <div className="flex flex-wrap gap-2 pb-1">
            <span className="text-xs text-gray-500 self-center font-medium">Đang lọc:</span>
            {filters.category !== 'All' && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-semibold border border-emerald-200">
                {filters.category}
                <button onClick={() => updateFilter('category', 'All')}><X size={12} /></button>
              </motion.span>
            )}
            {filters.search && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-xl font-semibold border border-blue-200">
                "{filters.search}"
                <button onClick={() => updateFilter('search', '')}><X size={12} /></button>
              </motion.span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs rounded-xl font-semibold border border-purple-200">
                ${filters.minPrice || '0'} – ${filters.maxPrice || '∞'}
                <button onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}><X size={12} /></button>
              </motion.span>
            )}
            {filters.minRating && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-xl font-semibold border border-amber-200">
                ≥ {filters.minRating} sao
                <button onClick={() => updateFilter('minRating', '')}><X size={12} /></button>
              </motion.span>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex gap-8 flex-1 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 overflow-y-auto">
          <ProductFilter />
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={filteredProducts} loading={loading} />
          {totalPages > 1 && (
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p - 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Mobile filter button — separate to avoid hook-in-render issues
const MobileFilterButton = () => {
  return (
    <button
      onClick={() => {
        // Trigger mobile filter via custom event
        window.dispatchEvent(new CustomEvent('open-mobile-filter'));
      }}
      className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
    >
      <SlidersHorizontal size={15} />
      Bộ lọc
    </button>
  );
};

export default Products;
