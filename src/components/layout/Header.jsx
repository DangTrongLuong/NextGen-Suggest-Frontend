import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Search, User, Menu, X,
  ChevronDown, LogOut, Settings, Package
} from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { productService } from '../../services/productService';
import LoginModal from '../common/LoginModal';
import logoNivora from '../../assets/logo-nivora.jpg';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';

const navLinks = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Danh mục', to: '/products' },
  { label: 'Đơn hàng', to: '/orders' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchFocused(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
        setSearchResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
  };

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await productService.search(searchQuery.trim(), true, 8);
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch search results:', err);
        setSearchResults([]);
        toast.error('Không thể tìm kiếm. Vui lòng thử lại.');
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchFocused(false);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const handleNavLinkClick = (e, link) => {
    if (link.to === '/orders' && !user) {
      e.preventDefault();
      toast.error('Vui lòng đăng nhập để tiếp tục');
      setLoginModalOpen(true);
      setMobileOpen(false);
    }
  };

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
          scrolled
            ? 'glass-nav shadow-sm border-b border-white/60'
            : 'bg-white/95'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[68px] gap-4">

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <motion.img
                src={logoNivora}
                alt="NIVORA"
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="h-9 w-auto object-contain rounded-xl shadow-sm group-hover:shadow-glow-sm transition-shadow duration-300"
              />
              <span className="text-2xl font-extrabold tracking-wide text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">
                NIVORA
              </span>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleNavLinkClick(e, link)}
                  className={clsx(
                    'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    location.pathname === link.to
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  )}
                >
                  {link.label}
                  {location.pathname === link.to && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-600 rounded-full"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* ── Search Bar (desktop center) ── */}
            {false && (
              <div ref={searchRef} className="hidden md:flex flex-1 max-w-xs relative">
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <div className={clsx(
                    'flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300',
                    searchFocused
                      ? 'bg-white border-emerald-400 shadow-md shadow-emerald-100 ring-2 ring-emerald-200'
                      : 'bg-gray-50/80 border-gray-200 hover:border-gray-300 hover:bg-white'
                  )}>
                    <Search size={15} className={clsx('flex-shrink-0 transition-colors', searchFocused ? 'text-emerald-500' : 'text-gray-400')} />
                    <input
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder="Tìm kiếm sản phẩm..."
                      className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400 min-w-0"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                        <X size={14} className="text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Search dropdown */}
                <AnimatePresence>
                  {searchFocused && searchQuery.trim().length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      {searchLoading ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">Đang tìm kiếm...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp</div>
                      ) : (
                        <>
                          {searchResults.map((p) => (
                            <Link
                              key={p.id}
                              to={`/products/${p.id}`}
                              onClick={() => { setSearchFocused(false); setSearchResults([]); setSearchQuery(''); }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <img src={p.imageUrl || (p.images?.find(img => img.isPrimary)?.url ?? p.images?.[0]?.url ?? '')} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                <p className="text-xs text-emerald-600 font-semibold">{formatPrice(p.basePrice)}</p>
                              </div>
                            </Link>
                          ))}
                          <Link
                            to={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                            onClick={() => { setSearchFocused(false); setSearchResults([]); setSearchQuery(''); }}
                            className="block px-4 py-3 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50 border-t border-gray-100"
                          >
                            Xem tất cả kết quả
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Right Actions ── */}
            <div className="flex items-center gap-0.5">

              {/* Mobile search icon */}
              {/*
              <button
                onClick={() => setSearchFocused(!searchFocused)}
                className="md:hidden p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Search size={20} />
              </button>
              */}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 group"
              >
                <Heart size={20} className="group-hover:scale-110 transition-transform" />
                <AnimatePresence>
                  {wishlist.length > 0 && (
                    <motion.span
                      key={wishlist.length}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                    >
                      {wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 group"
              >
                <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* User / Login */}
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={user.avatar || user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=10b981&color=fff`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover bg-gray-200 ring-2 ring-emerald-200"
                    />
                    <ChevronDown
                      size={14}
                      className={clsx('text-gray-500 hidden sm:block transition-transform duration-200', userMenuOpen && 'rotate-180')}
                    />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={15} /> Tài khoản của tôi
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Package size={15} /> Đơn hàng của tôi
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Settings size={15} /> Quản trị
                          </Link>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} /> Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 shine"
                >
                  <User size={15} /> Đăng nhập
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors ml-1"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X size={20} />
                    </motion.div>
                  ) : (
                    <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {/*
        <AnimatePresence>
          {searchFocused && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3">
                <form onSubmit={handleSearchSubmit}>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-200 transition-all">
                    <Search size={15} className="text-gray-400 flex-shrink-0" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </form>
                {searchQuery.trim().length >= 2 && (
                  <div className="mt-2 space-y-1">
                    {searchLoading ? (
                      <p className="px-3 py-2.5 text-sm text-gray-500">Đang tìm kiếm...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="px-3 py-2.5 text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp</p>
                    ) : (
                      <>
                        {searchResults.map((p) => (
                          <Link
                            key={p.id}
                            to={`/products/${p.id}`}
                            onClick={() => { setSearchFocused(false); setSearchResults([]); setSearchQuery(''); }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <img src={p.imageUrl || (p.images?.find(img => img.isPrimary)?.url ?? p.images?.[0]?.url ?? '')} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{p.name}</p>
                              <p className="text-xs text-emerald-600 font-semibold">{formatPrice(p.basePrice)}</p>
                            </div>
                          </Link>
                        ))}
                        <Link
                          to={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                          onClick={() => { setSearchFocused(false); setSearchResults([]); setSearchQuery(''); setMobileOpen(false); }}
                          className="block px-3 py-2.5 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl"
                        >
                          Xem tất cả kết quả
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        */}

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      to={link.to}
                      onClick={(e) => handleNavLinkClick(e, link)}
                      className={clsx(
                        'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        location.pathname === link.to
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {!user && (
                  <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                    <button
                      onClick={() => { setMobileOpen(false); setLoginModalOpen(true); }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      Đăng nhập
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};

export default Header;
