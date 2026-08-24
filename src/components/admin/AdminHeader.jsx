import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/admin': 'Tổng quan Quản trị',
  '/admin/products': 'Quản lý Sản phẩm',
  '/admin/products/add': 'Thêm sản phẩm mới',
  '/admin/category-mains': 'Danh mục chính',
  '/admin/category-mains/add': 'Thêm danh mục chính',
  '/admin/categories': 'Danh mục sản phẩm',
  '/admin/categories/add': 'Thêm danh mục',
  '/admin/orders': 'Quản lý Đơn hàng',
  '/admin/customers': 'Quản lý Khách hàng',
  '/admin/import-history': 'Lịch sử Nhập Excel',
  '/admin/settings': 'Cài đặt Hệ thống',
};

const AdminHeader = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();

  const title = Object.entries(pageTitles).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || 'Quản trị viên';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 h-14 flex items-center justify-between shadow-card">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full" />
        </button>
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0f172a&color=fff`}
              alt={user.name}
              className="w-7 h-7 rounded-full bg-slate-100 object-cover border border-slate-200"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
