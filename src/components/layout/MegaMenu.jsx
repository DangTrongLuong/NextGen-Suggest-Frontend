import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

/**
 * Modern MegaMenu component resembling Canifa/Uniqlo ecommerce style.
 * Displays Level 1 categories as columns and Level 2 categories as list items.
 * Level 3+ categories and image banners are completely removed.
 */
const MegaMenu = ({ categoryMain, categories = [], onClose, isNested = false }) => {
  if (!categoryMain) return null;

  return (
    <motion.div
      initial={isNested ? undefined : { opacity: 0, y: 8 }}
      animate={isNested ? undefined : { opacity: 1, y: 0 }}
      exit={isNested ? undefined : { opacity: 0, y: 8 }}
      transition={isNested ? undefined : { duration: 0.2, ease: 'easeOut' }}
      className={clsx(
        'bg-white',
        isNested
          ? 'w-full h-full overflow-hidden'
          : 'absolute left-0 right-0 w-full border-t border-gray-100 shadow-2xl z-50 max-h-[calc(100vh-130px)] overflow-y-auto'
      )}
      style={isNested ? undefined : { top: '100%' }}
      onMouseEnter={isNested ? undefined : (e) => e.stopPropagation()}
    >
      <div className={clsx(
        'w-full',
        isNested ? 'px-6 py-4' : 'max-w-[96%] xl:max-w-[94%] mx-auto px-4 sm:px-6 py-8'
      )}>
        {categories.length === 0 ? (
          <div className="text-gray-400 text-xs py-4 font-semibold text-center">
            Chưa có danh mục con
          </div>
        ) : (
          /* Flexible grid of category columns, utilizing full width (up to 8 columns on large screens) */
          <div className={clsx(
            'grid gap-x-8 gap-y-10',
            isNested
              ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'
          )}>
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
