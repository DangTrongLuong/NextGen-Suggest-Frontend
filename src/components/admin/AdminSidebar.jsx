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
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <img
            src={logoNivora}
            alt="NIVORA"
            className="h-7 w-auto object-contain rounded"
          />
          <div>
            <p className="text-xs font-extrabold tracking-wider uppercase text-white">NIVORA</p>
            <p className="text-[10px] text-slate-400 font-medium">Control Center</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded text-slate-400 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                isActive
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="text-white" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/60 text-xs">
            <img
              src={user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4f46e5&color=fff`}
              alt={user.name}
              className="w-7 h-7 rounded-full bg-slate-700 object-cover"
            />
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 border-r border-slate-800">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-60 shadow-2xl lg:hidden"
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
