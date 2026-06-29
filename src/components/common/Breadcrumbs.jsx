import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

/**
 * Breadcrumbs component to display the current navigation path.
 * Format: Trang chủ > Danh mục > Category Main > Category Cha > Category Con
 *
 * @param {Array} items - List of crumb objects: { label: string, to?: string }
 */
const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center flex-wrap gap-1.5 text-sm font-bold text-gray-500"
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-emerald-600 transition-colors duration-200"
      >
        <Home size={13} className="text-gray-400" />
        <span>Trang chủ</span>
      </Link>

      <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />

      <Link
        to="/products"
        className="hover:text-emerald-600 transition-colors duration-200"
      >
        Sản phẩm
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            {isLast || !item.to ? (
              <span className="text-gray-900 font-bold truncate max-w-[150px] sm:max-w-xs">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-emerald-600 transition-colors duration-200 truncate max-w-[150px] sm:max-w-xs"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
