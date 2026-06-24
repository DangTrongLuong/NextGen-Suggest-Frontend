import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronRight, Grid } from 'lucide-react';
import clsx from 'clsx';
import { useCategoryTree } from '../../hooks/useCategoryTree';
import MegaMenu from './MegaMenu';

/**
 * Responsive Category Navigation Bar.
 * Desktop: Horizontal bar under Header, opens MegaMenu on hover.
 * Mobile: Slide-in Drawer with a multi-level accordion layout.
 */
const CategoryNavBar = () => {
  const { categoryMains, categoryTreeByMain, loading } = useCategoryTree();
  const [activeMainId, setActiveMainId] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Mobile Accordion states
  const [expandedMainId, setExpandedMainId] = useState(null);
  const [expandedLevel1Id, setExpandedLevel1Id] = useState(null);

  const timeoutRef = useRef(null);
  const navBarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to scroll to apply light shadow when sticky
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus and reset accordion on page transition
  useEffect(() => {
    setActiveMainId(null);
    setMobileDrawerOpen(false);
    setExpandedMainId(null);
    setExpandedLevel1Id(null);
  }, [location.pathname]);

  // Handle keyboard navigation for desktop accessibility
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

  // Desktop Hover Timers to prevent flicker
  const handleMouseEnterMain = (mainId) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMainId(mainId);
  };

  const handleMouseLeaveMain = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMainId(null);
    }, 200); // 200ms delay to keep open while moving to Mega Menu
  };

  const activeMain = categoryMains.find((m) => m.id === activeMainId);

  // Keyboard navigation helpers
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

  // Skeleton Loader for NavBar
  if (loading && categoryMains.length === 0) {
    return (
      <div className="w-full bg-white border-b border-gray-100 h-11 flex items-center justify-center">
        <div className="flex gap-6 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={navBarRef}
      className={clsx(
        'w-full z-30 transition-all duration-300',
        'fixed top-16 lg:top-[68px] left-0 right-0',
        scrolled 
          ? 'bg-emerald-900 shadow-md border-b border-emerald-800' 
          : 'bg-emerald-900 border-b border-emerald-850'
      )}
    >
      {/* ── DESKTOP & TABLET NAVBAR ── */}
      <div className="hidden md:block max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6">
        <nav
          aria-label="Category Main Navigation"
          className="relative flex items-center justify-between h-11"
        >
          {/* Scrollable container for CategoryMains */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-grow select-none pr-4 py-1">
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
                      'px-4 py-2 text-xs font-black tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer outline-none focus:bg-emerald-850',
                      isOpened
                        ? 'text-white bg-emerald-800 shadow-inner'
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
                    )}
                  >
                    {main.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick link for All Categories */}
          <Link
            to="/products"
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-200 hover:text-white transition-colors"
          >
            <Grid size={13} className="text-emerald-300" />
            <span>Tất cả danh mục</span>
          </Link>
        </nav>
      </div>

      {/* ── MOBILE NAVBAR TRIGGER ── */}
      <div className="md:hidden w-full h-11 px-4 flex items-center justify-between border-t border-emerald-800/35">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase text-white bg-emerald-800 hover:bg-emerald-750 active:scale-95 transition-all outline-none"
        >
          <Menu size={14} className="text-emerald-200" />
          <span>Danh mục sản phẩm</span>
        </button>

        <Link
          to="/products"
          className="text-xs font-bold text-emerald-200 hover:text-white transition-colors"
        >
          Tất cả sản phẩm
        </Link>
      </div>

      {/* ── DESKTOP MEGA MENU CONTAINER ── */}
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

      {/* ── MOBILE DRAWER NAVIGATION (Slide in from Left with Accordion) ── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[290px] max-w-[85%] bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-emerald-950/20 flex items-center justify-between bg-emerald-900 text-white">
                <span className="text-sm font-black tracking-wide uppercase">
                  Danh mục sản phẩm
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Scrollable Accordion Area */}
              <div className="flex-1 overflow-y-auto py-2">
                <div className="flex flex-col">
                  {categoryMains.map((main) => {
                    const isMainExpanded = expandedMainId === main.id;
                    const rootCats = categoryTreeByMain[main.id] || [];
                    const hasSub = rootCats.length > 0;

                    return (
                      <div key={main.id} className="border-b border-gray-55/60 last:border-0">
                        {/* CategoryMain Row */}
                        <button
                          onClick={() => {
                            if (hasSub) {
                              setExpandedMainId(isMainExpanded ? null : main.id);
                              setExpandedLevel1Id(null); // Close Level 1 children on main toggle
                            } else {
                              navigate(`/products/${main.slug}`);
                              setMobileDrawerOpen(false);
                            }
                          }}
                          className={clsx(
                            'w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-bold transition-colors text-left outline-none',
                            isMainExpanded
                              ? 'text-emerald-600 bg-emerald-50/20'
                              : 'text-gray-800 hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {main.imageUrl && (
                              <img
                                src={main.imageUrl}
                                alt={main.name}
                                className="w-6 h-6 rounded-lg object-cover bg-gray-50 border border-gray-100"
                              />
                            )}
                            <span className="truncate">{main.name}</span>
                          </div>
                          {hasSub && (
                            <ChevronRight
                              size={14}
                              className={clsx(
                                'text-gray-400 transition-transform duration-200',
                                isMainExpanded && 'rotate-90 text-emerald-600'
                              )}
                            />
                          )}
                        </button>

                        {/* Level 1 Accordion Content */}
                        <AnimatePresence initial={false}>
                          {isMainExpanded && hasSub && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-gray-50/40 pl-4 pr-2 py-1 flex flex-col gap-0.5 border-t border-gray-100/50"
                            >
                              {/* Option to view all products under this Main category */}
                              <Link
                                to={`/products/${main.slug}`}
                                onClick={() => setMobileDrawerOpen(false)}
                                className="px-3 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 block"
                              >
                                Xem tất cả "{main.name}"
                              </Link>

                              {rootCats.map((level1Cat) => {
                                const isLevel1Expanded = expandedLevel1Id === level1Cat.id;
                                const level2Cats = level1Cat.children || [];
                                const hasLevel2 = level2Cats.length > 0;

                                return (
                                  <div key={level1Cat.id} className="flex flex-col">
                                    {/* Level 1 Row */}
                                    <button
                                      onClick={() => {
                                        if (hasLevel2) {
                                          setExpandedLevel1Id(isLevel1Expanded ? null : level1Cat.id);
                                        } else {
                                          navigate(`/products/${main.slug}/${level1Cat.slug}`);
                                          setMobileDrawerOpen(false);
                                        }
                                      }}
                                      className={clsx(
                                        'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left rounded-lg outline-none',
                                        isLevel1Expanded
                                          ? 'text-emerald-600 font-bold bg-gray-100/30'
                                          : 'text-gray-700 hover:bg-gray-100/40'
                                      )}
                                    >
                                      <span>{level1Cat.name}</span>
                                      {hasLevel2 && (
                                        <ChevronRight
                                          size={12}
                                          className={clsx(
                                            'text-gray-400 transition-transform duration-200',
                                            isLevel1Expanded && 'rotate-90 text-emerald-600'
                                          )}
                                        />
                                      )}
                                    </button>

                                    {/* Level 2 Accordion Content */}
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
                                            className="px-2 py-1.5 text-[11px] font-bold text-emerald-600 block hover:text-emerald-700"
                                          >
                                            Xem tất cả "{level1Cat.name}"
                                          </Link>

                                          {level2Cats.map((level2Cat) => (
                                            <Link
                                              key={level2Cat.id}
                                              to={`/products/${main.slug}/${level1Cat.slug}/${level2Cat.slug}`}
                                              onClick={() => setMobileDrawerOpen(false)}
                                              className="px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:text-emerald-600 block rounded-md"
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

                <div className="border-t border-gray-100 my-2 pt-2 px-2">
                  <Link
                    to="/products"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-[13px] font-black text-emerald-600 hover:bg-emerald-50 rounded-xl"
                  >
                    <Grid size={15} className="text-emerald-600" />
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
