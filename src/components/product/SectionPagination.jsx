import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SectionPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-45 disabled:hover:bg-white disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Numbers */}
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pageNum = idx + 1;
        const isActive = pageNum === currentPage;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center border transition-all duration-200 ${
              isActive
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white border-gray-200/80 hover:bg-gray-50 text-gray-700'
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-45 disabled:hover:bg-white disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Next Page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default SectionPagination;
