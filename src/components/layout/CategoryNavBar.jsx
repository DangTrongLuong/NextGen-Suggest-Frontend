import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronRight, Grid } from 'lucide-react';
import clsx from 'clsx';
import { useCategoryTree } from '../../hooks/useCategoryTree';
import MegaMenu from './MegaMenu';

const CategoryNavBar = () => {
  const { categoryMains, categoryTreeByMain, loading } = useCategoryTree();
  const [activeMainId, setActiveMainId] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [expandedMainId, setExpandedMainId] = useState(null);
  const [expandedLevel1Id, setExpandedLevel1Id] = useState(null);

  const timeoutRef = useRef(null);
  const navBarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveMainId(null);
    setMobileDrawerOpen(false);
    setExpandedMainId(null);
    setExpandedLevel1Id(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveMainId(null);
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseEnterMain = (mainId) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMainId(mainId);
  };

  const handleMouseLeaveMain = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMainId(null);
    }, 200);
  };

  const activeMain = categoryMains.find((m) => m.id === activeMainId);

  const handleMainKeyDown = (e, index, main) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextBtn = document.getElementById(`nav-main-btn-${(index + 1) % categoryMains.length}`);
      nextBtn?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevBtn = document.getElementById(
        `nav-main-btn-${(index - 1 + categoryMains.length) % categoryMains.length}`
      );
      prevBtn?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/products/${main.slug}`);
    } else if (e.key === 'ArrowDown' && categoryTreeByMain[main.id]?.length > 0) {
      e.preventDefault();
      setActiveMainId(main.id);
    }
  };

  if (loading && categoryMains.length === 0) {
    return (
      <div className="w-full bg-white border-b border-slate-100 h-10 flex items-center justify-center">
        <div className="flex gap-6 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 bg-slate-200 rounded w-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={navBarRef}
      className="w-full z-30 fixed top-16 lg:top-[68px] left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200/70"
    >
      {/* Desktop NavBar */}
      <div className="hidden md:block max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6">
        <nav
          aria-label="Category Main Navigation"
          className="relative flex items-center justify-between h-10"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-grow select-none pr-4 py-0.5">
            {categoryMains.map((main, index) => {
              const isOpened = activeMainId === main.id;
              const hasChildren = categoryTreeByMain[main.id]?.length > 0;

              return (
                <div
                  key={main.id}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => handleMouseEnterMain(main.id)}
                  onMouseLeave={handleMouseLeaveMain}
                >
                  <button
                    id={`nav-main-btn-${index}`}
                    role="menuitem"
                    aria-haspopup={hasChildren ? 'true' : 'false'}
                    aria-expanded={isOpened ? 'true' : 'false'}
                    aria-controls={hasChildren ? `mega-menu-${main.id}` : undefined}
                    onKeyDown={(e) => handleMainKeyDown(e, index, main)}
                    onClick={() => navigate(`/products/${main.slug}`)}
                    className={clsx(
                      'px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-150 cursor-pointer outline-none',
                      isOpened
                        ? 'text-slate-900 bg-slate-100 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    {main.name}
                  </button>
                </div>
              );
            })}
          </div>

          <Link
            to="/products"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors group"
          >
            <Grid size={13} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span>Tất cả danh mục</span>
          </Link>
        </nav>
      </div>

      {/* Mobile Trigger */}
      <div className="md:hidden w-full h-10 px-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold uppercase text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all outline-none"
        >
          <Menu size={14} className="text-slate-600" />
          <span>Danh mục sản phẩm</span>
        </button>

        <Link
          to="/products"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          Tất cả sản phẩm
        </Link>
      </div>

      {/* Desktop Mega Menu */}
      <AnimatePresence>
        {activeMain && (
          <div
            className="hidden md:block absolute left-0 right-0 w-full"
            style={{ top: '100%' }}
            onMouseEnter={() => handleMouseEnterMain(activeMain.id)}
            onMouseLeave={handleMouseLeaveMain}
          >
            <MegaMenu
              id={`mega-menu-${activeMain.id}`}
              categoryMain={activeMain}
              categories={categoryTreeByMain[activeMain.id] || []}
              onClose={() => setActiveMainId(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[290px] max-w-[85%] bg-white z-50 shadow-xl flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Danh mục sản phẩm
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                <div className="flex flex-col">
                  {categoryMains.map((main) => {
                    const isMainExpanded = expandedMainId === main.id;
                    const rootCats = categoryTreeByMain[main.id] || [];
                    const hasSub = rootCats.length > 0;

                    return (
                      <div key={main.id} className="border-b border-slate-100 last:border-0">
                        <button
                          onClick={() => {
                            if (hasSub) {
                              setExpandedMainId(isMainExpanded ? null : main.id);
                              setExpandedLevel1Id(null);
                            } else {
                              navigate(`/products/${main.slug}`);
                              setMobileDrawerOpen(false);
                            }
                          }}
                          className={clsx(
                            'w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-colors text-left outline-none',
                            isMainExpanded
                              ? 'text-slate-900 bg-slate-50'
                              : 'text-slate-800 hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {main.imageUrl && (
                              <img
                                src={main.imageUrl}
                                alt={main.name}
                                className="w-5 h-5 rounded-md object-cover bg-slate-50 border border-slate-200"
                              />
                            )}
                            <span className="truncate">{main.name}</span>
                          </div>
                          {hasSub && (
                            <ChevronRight
                              size={14}
                              className={clsx(
                                'text-slate-400 transition-transform duration-200',
                                isMainExpanded && 'rotate-90 text-slate-900'
                              )}
                            />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {isMainExpanded && hasSub && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-slate-50/60 pl-4 pr-2 py-1 flex flex-col gap-0.5"
                            >
                              <Link
                                to={`/products/${main.slug}`}
                                onClick={() => setMobileDrawerOpen(false)}
                                className="px-3 py-1.5 text-xs font-bold text-emerald-600 block"
                              >
                                Xem tất cả "{main.name}"
                              </Link>

                              {rootCats.map((level1Cat) => {
                                const isLevel1Expanded = expandedLevel1Id === level1Cat.id;
                                const level2Cats = level1Cat.children || [];
                                const hasLevel2 = level2Cats.length > 0;

                                return (
                                  <div key={level1Cat.id} className="flex flex-col">
                                    <button
                                      onClick={() => {
                                        if (hasSub) {
                                          setExpandedLevel1Id(isLevel1Expanded ? null : level1Cat.id);
                                        } else {
                                          navigate(`/products/${main.slug}/${level1Cat.slug}`);
                                          setMobileDrawerOpen(false);
                                        }
                                      }}
                                      className={clsx(
                                        'w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold transition-colors text-left rounded-md outline-none',
                                        isLevel1Expanded
                                          ? 'text-slate-900 font-bold bg-slate-200/50'
                                          : 'text-slate-700 hover:bg-slate-200/40'
                                      )}
                                    >
                                      <span>{level1Cat.name}</span>
                                      {hasLevel2 && (
                                        <ChevronRight
                                          size={12}
                                          className={clsx(
                                            'text-slate-400 transition-transform duration-200',
                                            isLevel1Expanded && 'rotate-90 text-slate-900'
                                          )}
                                        />
                                      )}
                                    </button>

                                    <AnimatePresence initial={false}>
                                      {isLevel1Expanded && hasLevel2 && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.15 }}
                                          className="overflow-hidden pl-4 pr-2 py-0.5 flex flex-col gap-0.5"
                                        >
                                          <Link
                                            to={`/products/${main.slug}/${level1Cat.slug}`}
                                            onClick={() => setMobileDrawerOpen(false)}
                                            className="px-2 py-1 text-[11px] font-bold text-emerald-600 block"
                                          >
                                            Xem tất cả "{level1Cat.name}"
                                          </Link>

                                          {level2Cats.map((level2Cat) => (
                                            <Link
                                              key={level2Cat.id}
                                              to={`/products/${main.slug}/${level1Cat.slug}/${level2Cat.slug}`}
                                              onClick={() => setMobileDrawerOpen(false)}
                                              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 block rounded-md"
                                            >
                                              {level2Cat.name}
                                            </Link>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 my-2 pt-2 px-2">
                  <Link
                    to="/products"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 rounded-lg"
                  >
                    <Grid size={14} className="text-slate-700" />
                    <span>Xem tất cả danh mục</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryNavBar;
