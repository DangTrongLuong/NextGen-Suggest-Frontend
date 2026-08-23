import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  LogOut, X, ChevronRight, Tag, History
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import logoNivora from '../../assets/logo-nivora.jpg';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
  { icon: Package, label: 'Sản phẩm', to: '/admin/products' },
  { icon: Tag, label: 'Danh mục chính', to: '/admin/category-mains' },
  { icon: Tag, label: 'Danh mục', to: '/admin/categories' },
  { icon: ShoppingBag, label: 'Đơn hàng', to: '/admin/orders' },
  { icon: Users, label: 'Khách hàng', to: '/admin/customers' },
  { icon: History, label: 'Lịch sử Import', to: '/admin/import-history' },
];

const AdminSidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img
            src={logoNivora}
            alt="NIVORA"
            className="h-8 w-auto object-contain rounded-lg"
          />
          <div>
            <p className="text-xs font-bold text-white tracking-widest uppercase">NIVORA</p>
            <p className="text-[10px] text-gray-500 tracking-wide">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NavLink
              to={to}
              end={to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={clsx('flex-shrink-0 transition-transform', !isActive && 'group-hover:scale-110')} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    size={13}
                    className={clsx(
                      'transition-all',
                      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0'
                    )}
                  />
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/5 p-4">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2 py-2 rounded-xl bg-white/3">
            <img
              src={user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=10b981&color=fff`}
              alt={user.name}
              className="w-9 h-9 rounded-full bg-gray-700 ring-2 ring-emerald-600/30"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
        >
          <LogOut size={17} className="group-hover:scale-110 transition-transform" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 shadow-2xl lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
