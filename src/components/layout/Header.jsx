import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Search, User, Menu, X,
  ChevronDown, LogOut, Settings, Package, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import LoginModal from '../common/LoginModal';
import logoNivora from '../../assets/logo-nivora.jpg';
import toast from 'react-hot-toast';
import SearchPopup from './SearchPopup';

const navLinks = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Đơn hàng', to: '/orders' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  const placeholderPhrases = useMemo(() => [
    'Tìm kiếm bàn làm việc, ghế xoay, sofa, giường ngủ...',
    'Tìm kiếm thời trang nam nữ, áo thun, quần jean, áo khoác...',
    'Tìm kiếm giày thể thao, giày tây, túi xách thời thượng...',
    'Tìm kiếm thảm trải sàn, đèn ngủ thông minh, đồ trang trí...'
  ], []);

  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer;

    const tick = () => {
      const currentPhrase = placeholderPhrases[phraseIdx];
      if (!isDeleting) {
        setPlaceholder(currentPhrase.substring(0, charIdx + 1));
        charIdx++;
        if (charIdx === currentPhrase.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2500);
        } else {
          timer = setTimeout(tick, 40);
        }
      } else {
        setPlaceholder(currentPhrase.substring(0, charIdx - 1));
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % placeholderPhrases.length;
          timer = setTimeout(tick, 400);
        } else {
          timer = setTimeout(tick, 20);
        }
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, [placeholderPhrases]);

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
    const handleOpenLogin = () => setLoginModalOpen(true);
    window.addEventListener('open-login-modal', handleOpenLogin);
    return () => window.removeEventListener('open-login-modal', handleOpenLogin);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (q) => {
    if (q.length > 100) {
      toast.error('Từ khóa tìm kiếm không được vượt quá 100 ký tự');
      setSearchQuery(q.slice(0, 100));
      return;
    }
    setSearchQuery(q);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim().slice(0, 100))}`);
      setSearchFocused(false);
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
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'glass-header shadow-xs'
            : 'bg-white border-b border-slate-100'
        )}
      >
        <div className="max-w-[96%] xl:max-w-[94%] mx-auto w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[68px] gap-4">

            {/* Logo & Navigation */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                <motion.img
                  src={logoNivora}
                  alt="NIVORA"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="h-9 w-auto object-contain rounded-lg border border-slate-200/80 shadow-xs"
                />
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                  NIVORA
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={(e) => handleNavLinkClick(e, link)}
                    className={clsx(
                      'relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                      location.pathname === link.to
                        ? 'text-slate-900 font-semibold bg-slate-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Prominent Central AI Search Input */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] mx-4 relative">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className={clsx(
                  'flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-200',
                  searchFocused
                    ? 'bg-white border-emerald-500 ring-3 ring-emerald-500/10 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                )}>
                  <Search size={16} className={clsx('flex-shrink-0 transition-colors', searchFocused ? 'text-emerald-600' : 'text-slate-400')} />
                  <input
                    value={searchQuery}
                    maxLength={100}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder={placeholder || 'Tìm kiếm sản phẩm thông minh...'}
                    className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder-slate-400 min-w-0 font-normal"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="hidden lg:flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100">
                      <Sparkles size={11} className="text-emerald-500" /> AI Search
                    </span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.delete('search');
                            next.set('page', '1');
                            return next;
                          });
                          if (!location.pathname.startsWith('/products')) {
                            navigate('/products');
                          }
                        }}
                        className="cursor-pointer flex items-center justify-center p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <AnimatePresence>
                <SearchPopup
                  isOpen={searchFocused}
                  searchQuery={searchQuery}
                  onSelectKeyword={(kw) => {
                    setSearchQuery(kw);
                    navigate(`/products?search=${encodeURIComponent(kw)}`);
                    setSearchFocused(false);
                  }}
                  onClose={() => setSearchFocused(false)}
                />
              </AnimatePresence>
            </div>

            {/* Right User & Cart Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchFocused(!searchFocused)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Search size={20} />
              </button>

              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors group"
                title="Danh sách yêu thích"
              >
                <Heart size={20} className="group-hover:scale-105 transition-transform" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors group"
                title="Giỏ hàng"
              >
                <ShoppingCart size={20} className="group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <img
                      src={user.avatar || user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0f172a&color=fff`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <ChevronDown
                      size={14}
                      className={clsx('text-slate-500 hidden sm:block transition-transform duration-200', userMenuOpen && 'rotate-180')}
                    />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-dropdown border border-slate-100 overflow-hidden py-1.5 z-50"
                      >
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User size={14} /> Tài khoản của tôi
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Package size={14} /> Đơn hàng của tôi
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Settings size={14} /> Quản trị
                          </Link>
                        )}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut size={14} /> Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all duration-200 cursor-pointer shadow-xs"
                >
                  <User size={14} /> Đăng nhập
                </button>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors ml-1"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {searchFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-white flex flex-col"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white shrink-0">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-100 rounded-xl border border-emerald-400 transition-all">
                    <Search size={16} className="text-emerald-600 flex-shrink-0" />
                    <input
                      autoFocus
                      value={searchQuery}
                      maxLength={100}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={placeholder || 'Tìm kiếm sản phẩm...'}
                      className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder-slate-400 min-w-0"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.delete('search');
                            next.set('page', '1');
                            return next;
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </form>
                <button
                  type="button"
                  onClick={() => setSearchFocused(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  Hủy
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 relative">
                <SearchPopup
                  isOpen={true}
                  searchQuery={searchQuery}
                  onSelectKeyword={(kw) => {
                    setSearchQuery(kw);
                    navigate(`/products?search=${encodeURIComponent(kw)}`);
                    setSearchFocused(false);
                    setMobileOpen(false);
                  }}
                  onClose={() => setSearchFocused(false)}
                  isMobileModal={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={(e) => handleNavLinkClick(e, link)}
                    className={clsx(
                      'block px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      location.pathname === link.to
                        ? 'text-slate-900 font-semibold bg-slate-100'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <button
                    onClick={() => { setMobileOpen(false); setLoginModalOpen(true); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};

export default Header;
