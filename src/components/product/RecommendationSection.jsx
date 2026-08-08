import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductGrid from './ProductGrid';
import SectionPagination from './SectionPagination';

const useResponsivePageSize = () => {
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setPageSize(8); // Desktop (4x2)
      } else if (width >= 768) {
        setPageSize(6); // Tablet (3x2)
      } else {
        setPageSize(4); // Mobile (2x2)
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return pageSize;
};

const RecommendationSection = ({
  title,
  desc,
  badge,
  badgeColor = 'emerald',
  products = [],
  loading = false,
  headerExtra = null,
  containerClassName = '',
  viewAll = false,
  viewAllHref = '/products'
}) => {
  const pageSize = useResponsivePageSize();
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(products.length / pageSize));
  }, [products, pageSize]);

  // Adjust page number if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, currentPage, pageSize]);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className={`py-2 sm:py-3 ${containerClassName}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-gray-100 pb-4">
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight uppercase">{title}</h2>
            {!loading && totalPages > 1 && (
              <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 rounded-full border border-gray-100 ml-2">
                Trang {currentPage}/{totalPages}
              </span>
            )}
          </div>
          {desc && <p className="text-gray-400 text-xs sm:text-sm mt-1.5 font-light">{desc}</p>}
        </div>

        <div className="flex items-center gap-4 shrink-0 mt-3 md:mt-0">
          {headerExtra}
          {viewAll && (
            <Link to={viewAllHref}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-500 hover:text-black transition-colors group">
              Xem tất cả <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      <ProductGrid products={currentProducts} loading={loading} placeholderCount={pageSize} />

      {!loading && totalPages > 1 && (
        <SectionPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </section>
  );
};

export default React.memo(RecommendationSection);
