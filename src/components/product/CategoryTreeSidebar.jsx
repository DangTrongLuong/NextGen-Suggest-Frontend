import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { categoryService } from '../../services/categoryService';
import { useProducts } from '../../context/ProductContext';

const CategoryNode = ({ category, activeCategory, onSelect, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = activeCategory === category.name || activeCategory === category.slug;

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(category);
  };

  return (
    <div className="select-none">
      <div
        onClick={handleSelect}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        className={clsx(
          'group flex items-center justify-between py-2 pr-3 rounded-xl cursor-pointer text-sm transition-all duration-150',
          isSelected
            ? 'bg-emerald-50 text-emerald-700 font-bold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {category.icon && <span className="text-base flex-shrink-0">{category.icon}</span>}
          <span className="truncate">{category.name}</span>
        </div>

        {hasChildren && (
          <button
            onClick={handleToggle}
            className="p-1 rounded-lg hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              activeCategory={activeCategory}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTreeSidebar = ({ activeCategory, onSelectCategory }) => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    categoryService
      .getTree()
      .then(setTree)
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 py-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1 max-h-[350px] overflow-y-auto scrollbar-thin">
      <div
        onClick={() => onSelectCategory('All')}
        className={clsx(
          'flex items-center px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors font-medium',
          activeCategory === 'All'
            ? 'bg-emerald-50 text-emerald-700 font-bold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
        )}
      >
        🌐 Tất cả danh mục
      </div>

      {tree.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          activeCategory={activeCategory}
          onSelect={(c) => onSelectCategory(c.slug)}
        />
      ))}
    </div>
  );
};

export default CategoryTreeSidebar;
