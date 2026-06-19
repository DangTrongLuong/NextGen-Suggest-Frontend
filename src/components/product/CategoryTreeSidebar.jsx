import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { categoryService } from '../../services/categoryService';
import { categoryMainService } from '../../services/categoryMainService';

const CategoryTreeSidebar = ({ activeCategory, onSelectCategory }) => {
  const [categoryMains, setCategoryMains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMainIds, setExpandedMainIds] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      categoryMainService.getAll().catch(() => []),
      categoryService.getAll().catch(() => []),
    ])
      .then(([mains, cats]) => {
        setCategoryMains(mains);
        setCategories(cats);
        // Find category main containing activeCategory slug and auto expand it
        if (activeCategory && activeCategory !== 'All') {
          const matchedCat = cats.find(c => c.slug === activeCategory || c.name === activeCategory);
          if (matchedCat && matchedCat.categoryMainId) {
            setExpandedMainIds([matchedCat.categoryMainId]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const toggleExpand = (mainId) => {
    setExpandedMainIds((prev) =>
      prev.includes(mainId) ? prev.filter((id) => id !== mainId) : [...prev, mainId]
    );
  };

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
          activeCategory === 'All' || !activeCategory
            ? 'bg-emerald-50 text-emerald-700 font-bold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
        )}
      >
        🌐 Tất cả danh mục
      </div>

      {categoryMains.map((main) => {
        const isExpanded = expandedMainIds.includes(main.id);
        const subCats = categories.filter((c) => c.categoryMainId === main.id);

        return (
          <div key={main.id} className="select-none">
            <div
              onClick={() => toggleExpand(main.id)}
              className="group flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-950 font-semibold"
            >
              <div className="flex items-center gap-2 truncate">
                {main.imageUrl ? (
                  <img src={main.imageUrl} alt={main.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                ) : (
                  <span className="text-base flex-shrink-0">📦</span>
                )}
                <span className="truncate">{main.name}</span>
              </div>
              {subCats.length > 0 && (
                <div className="text-gray-400">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </div>

            {isExpanded && subCats.length > 0 && (
              <div className="mt-1 pl-6 pr-2 border-l-2 border-emerald-100 flex flex-col gap-0.5">
                {subCats.map((child) => {
                  const isSelected = activeCategory === child.slug || activeCategory === child.name;
                  return (
                    <button
                      key={child.id}
                      onClick={() => onSelectCategory(child.slug)}
                      className={clsx(
                        'w-full py-1.5 px-2 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50/30'
                      )}
                    >
                      {child.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CategoryTreeSidebar;
