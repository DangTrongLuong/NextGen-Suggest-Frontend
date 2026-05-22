import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items }) => {
  const location = useLocation();

  const crumbs = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, i) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
      to: '/' + paths.slice(0, i + 1).join('/'),
    }));
  })();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link to="/" className="text-gray-400 hover:text-emerald-600 transition-colors">
        <Home size={15} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.to} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-gray-300" />
          {i === crumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.to} className="text-gray-500 hover:text-emerald-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
