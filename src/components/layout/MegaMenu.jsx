import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Modern MegaMenu component resembling Canifa/Uniqlo ecommerce style.
 * Displays Level 1 categories as columns and Level 2 categories as list items.
 * Level 3+ categories and image banners are completely removed.
 */
const MegaMenu = ({ categoryMain, categories = [], onClose }) => {
  if (!categoryMain) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute left-0 right-0 w-full bg-white border-t border-gray-100 shadow-2xl z-50 overflow-hidden"
      style={{ top: '100%' }}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className="max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6 py-8">
        {categories.length === 0 ? (
          <div className="text-gray-400 text-xs py-4 font-semibold text-center">
            Chưa có danh mục con
          </div>
        ) : (
          /* Flexible grid of category columns, utilizing full width (up to 8 columns on large screens) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-8 gap-y-10">
            {categories.map((rootCat) => {
              // Level 2 children
              const level2Cats = rootCat.children || [];

              return (
                <div key={rootCat.id} className="flex flex-col">
                  {/* Level 1 Category Header */}
                  <Link
                    to={`/products/${categoryMain.slug}/${rootCat.slug}`}
                    onClick={onClose}
                    className="font-semibold text-gray-900 text-[13px] tracking-wider uppercase mb-3.5 hover:text-emerald-600 transition-colors duration-200 block"
                  >
                    {rootCat.name}
                  </Link>

                  {/* Level 2 Categories list */}
                  {level2Cats.length > 0 && (
                    <ul className="space-y-2">
                      {level2Cats.map((level2Cat) => (
                        <li key={level2Cat.id}>
                          <Link
                            to={`/products/${categoryMain.slug}/${rootCat.slug}/${level2Cat.slug}`}
                            onClick={onClose}
                            className="text-[13px] font-normal text-gray-500 hover:text-emerald-600 transition-colors duration-200 block"
                          >
                            {level2Cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MegaMenu;
