import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const MegaMenu = ({ categoryMain, categories = [], onClose, isNested = false }) => {
  if (!categoryMain) return null;

  return (
    <motion.div
      initial={isNested ? undefined : { opacity: 0, y: 6 }}
      animate={isNested ? undefined : { opacity: 1, y: 0 }}
      exit={isNested ? undefined : { opacity: 0, y: 6 }}
      transition={isNested ? undefined : { duration: 0.18, ease: 'easeOut' }}
      className={clsx(
        'bg-white',
        isNested
          ? 'w-full h-full overflow-hidden'
          : 'absolute left-0 right-0 w-full border-t border-slate-100 shadow-dropdown z-50 max-h-[calc(100vh-130px)] overflow-y-auto'
      )}
      style={isNested ? undefined : { top: '100%' }}
      onMouseEnter={isNested ? undefined : (e) => e.stopPropagation()}
    >
      <div className={clsx(
        'w-full',
        isNested ? 'px-6 py-4' : 'max-w-[96%] xl:max-w-[94%] mx-auto px-6 sm:px-8 py-7 sm:py-8'
      )}>
        {categories.length === 0 ? (
          <div className="text-slate-400 text-xs py-4 font-semibold text-center">
            Chưa có danh mục con
          </div>
        ) : (
          <div className={clsx(
            'grid gap-x-10 gap-y-9',
            isNested
              ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'
          )}>
            {categories.map((rootCat) => {
              const level2Cats = rootCat.children || [];

              return (
                <div key={rootCat.id} className="flex flex-col">
                  <Link
                    to={`/products/${categoryMain.slug}/${rootCat.slug}`}
                    onClick={onClose}
                    className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-3 pb-1 border-b border-slate-100 hover:text-emerald-600 transition-colors duration-150 block"
                  >
                    {rootCat.name}
                  </Link>

                  {level2Cats.length > 0 && (
                    <ul className="space-y-2">
                      {level2Cats.map((level2Cat) => (
                        <li key={level2Cat.id}>
                          <Link
                            to={`/products/${categoryMain.slug}/${rootCat.slug}/${level2Cat.slug}`}
                            onClick={onClose}
                            className="text-xs font-normal text-slate-600 hover:text-emerald-600 hover:translate-x-0.5 transition-all duration-150 block py-0.5"
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
