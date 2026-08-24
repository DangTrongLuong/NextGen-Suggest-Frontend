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
        setPageSize(8);
      } else if (width >= 768) {
        setPageSize(6);
      } else {
        setPageSize(4);
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
  badgeColor = 'slate',
  products = [],
  loading = false,
  headerExtra = null,
  containerClassName = '',
  viewAll = false,
  viewAllHref = '/products'
}) => {
  const pageSize = useResponsivePageSize();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(products.length / pageSize));
  }, [products, pageSize]);

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
    <section className={`py-4 ${containerClassName}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-3 border-b border-slate-200/80 pb-4">
        <div>
          {badge && (
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded mb-1.5 border ${
              badgeColor === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
              badgeColor === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              badgeColor === 'indigo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              {badge}
            </span>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight uppercase">{title}</h2>
            {!loading && totalPages > 1 && (
              <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 ml-1">
                {currentPage}/{totalPages}
              </span>
            )}
          </div>
          {desc && <p className="text-slate-500 text-xs sm:text-sm mt-1 font-normal">{desc}</p>}
        </div>

        <div className="flex items-center gap-4 shrink-0 mt-2 md:mt-0">
          {headerExtra}
          {viewAll && (
            <Link to={viewAllHref}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-600 transition-colors group">
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
