import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/products': 'Sản phẩm',
  '/admin/products/add': 'Thêm sản phẩm',
  '/admin/category-mains': 'Danh mục chính',
  '/admin/category-mains/add': 'Thêm danh mục chính',
  '/admin/categories': 'Danh mục',
  '/admin/categories/add': 'Thêm danh mục',
  '/admin/orders': 'Đơn hàng',
  '/admin/customers': 'Khách hàng',
  '/admin/settings': 'Cài đặt',
};

const AdminHeader = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();

  const title = Object.entries(pageTitles).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || 'Admin';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200/60 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">NIVORA Admin</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200 ml-1">
            <img
              src={user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=10b981&color=fff`}
              alt={user.name}
              className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-emerald-200 object-cover"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
              <p className="text-xs text-emerald-600 font-medium capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
