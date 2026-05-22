import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  const renderPages = () => {
    const result = [];
    let prev = null;
    for (const page of visiblePages) {
      if (prev && page - prev > 1) {
        result.push(<span key={`ellipsis-${page}`} className="px-2 text-gray-400">…</span>);
      }
      result.push(
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={clsx(
            'w-9 h-9 rounded-lg text-sm font-medium transition-all',
            page === currentPage
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          {page}
        </button>
      );
      prev = page;
    }
    return result;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={18} />
      </button>
      {renderPages()}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
