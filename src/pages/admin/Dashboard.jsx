import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Users, Package,
  TrendingUp, ArrowRight, Star, Tag, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatPrice';
import { normalizeProducts } from '../../utils/productNormalizer';
import { ORDER_STATUS_MAP } from '../../utils/orderStatus';
import { Spinner } from '../../components/common/Loading';

const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, ordersPage, featured] = await Promise.all([
        adminService.getDashboard(),
        adminService.getOrders({ page: 0, size: 5 }),
        productService.getFeatured(),
      ]);
      setStats(dash);
      setRecentOrders(ordersPage?.content || []);
      setTopProducts(normalizeProducts(featured).slice(0, 5));
    } catch {
      toast.error('Không tải được dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const handler = () => loadDashboard();
    window.addEventListener('product-changed', handler);
    window.addEventListener('inventory-changed', handler);
    return () => {
      window.removeEventListener('product-changed', handler);
      window.removeEventListener('inventory-changed', handler);
    };
  }, [loadDashboard]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Doanh thu', value: formatPrice(stats.totalRevenue || 0), icon: DollarSign, color: 'emerald' },
    { label: 'Đơn hàng', value: stats.totalOrders, icon: ShoppingBag, color: 'blue' },
    { label: 'Khách hàng', value: stats.totalCustomers, icon: Users, color: 'purple' },
    { label: 'Sản phẩm', value: stats.totalProducts, icon: Package, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            {...fadeUp(i * 0.08)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                <Icon size={22} />
              </div>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alert cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div {...fadeUp(0.35)} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-amber-800">Đơn hàng chờ xử lý</p>
            <p className="text-2xl font-black text-amber-700">{stats.pendingOrders}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1">
            Xem ngay <ArrowRight size={13} />
          </Link>
        </motion.div>
        <motion.div {...fadeUp(0.4)} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-800">Đang xử lý</p>
            <p className="text-2xl font-black text-blue-700">{stats.processingOrders}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
            Xem ngay <ArrowRight size={13} />
          </Link>
        </motion.div>
        <motion.div {...fadeUp(0.45)} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-red-800 flex items-center gap-1.5"><AlertTriangle size={14} /> Sắp hết hàng</p>
            <p className="text-2xl font-black text-red-700">{stats.lowStockProducts}</p>
          </div>
          <Link to="/admin/products" className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1">
            Xem ngay <ArrowRight size={13} />
          </Link>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div {...fadeUp(0.5)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có đơn hàng nào</p>
            )}
            {recentOrders.map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
              return (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customerName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div {...fadeUp(0.55)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Sản phẩm nổi bật</h3>
            <Link to="/admin/products" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có sản phẩm nổi bật</p>
            )}
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <img
                  src={product.images.find(img => img.isPrimary)?.url ?? product.images[0]?.url ?? 'https://via.placeholder.com/40'}
                  alt={product.name}
                  className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      product.stock === 0 ? 'bg-red-100 text-red-600' :
                      product.stock < 20 ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {product.stock === 0 ? 'Hết hàng' : `${product.stock} còn`}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(product.price)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div {...fadeUp(0.6)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/products/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            <Package size={15} /> Thêm sản phẩm
          </Link>
          <Link to="/admin/categories/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            <Tag size={15} /> Thêm danh mục
          </Link>
          <Link to="/admin/orders"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Quản lý đơn hàng
          </Link>
          <Link to="/admin/customers"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Khách hàng
          </Link>
          <Link to="/" target="_blank"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Xem cửa hàng ↗
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
