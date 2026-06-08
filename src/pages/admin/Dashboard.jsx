import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Users, Package,
  TrendingUp, ArrowRight, Star, Tag, AlertTriangle, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';
import { ORDER_STATUS_MAP } from '../../utils/orderStatus';
import { Spinner } from '../../components/common/Loading';

const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

const chartColors = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tooltip interactive state
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashStats, revChart, topProds, catStats, ordersPage] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getDashboardRevenueChart(),
        adminService.getDashboardTopProducts(),
        adminService.getDashboardCategoryStats(),
        adminService.getOrders({ page: 0, size: 5 }),
      ]);
      setStats(dashStats);
      setRevenueChartData(revChart || []);
      setTopProducts(topProds || []);
      setCategoryStats(catStats || []);
      setRecentOrders(ordersPage?.content || []);
    } catch (err) {
      console.error(err);
      toast.error('Không tải được dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Line Chart Helper
  const lineChart = useMemo(() => {
    if (revenueChartData.length < 2) return null;
    const width = 500;
    const height = 160;
    const padding = 20;

    const maxVal = Math.max(...revenueChartData.map(d => d.revenue), 100000);

    const points = revenueChartData.map((d, index) => {
      const x = padding + (index / (revenueChartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.revenue / maxVal) * (height - 2 * padding);
      return { x, y, date: d.date, value: d.revenue };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { points, linePath, areaPath, width, height, maxVal };
  }, [revenueChartData]);

  // Bar Chart Helper (Last 10 days of orders)
  const barChart = useMemo(() => {
    const data = revenueChartData.slice(-10);
    if (data.length === 0) return null;
    const width = 500;
    const height = 160;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => d.orders), 5);

    const bars = data.map((d, index) => {
      const colWidth = (width - 2 * padding) / data.length;
      const x = padding + index * colWidth + 5;
      const barHeight = (d.orders / maxVal) * (height - 2 * padding);
      const y = height - padding - barHeight;
      return {
        x,
        y,
        w: colWidth - 10,
        h: Math.max(barHeight, 2),
        date: d.date,
        value: d.orders
      };
    });

    return { bars, width, height, maxVal };
  }, [revenueChartData]);

  // Donut Chart Helper
  const donutChart = useMemo(() => {
    if (categoryStats.length === 0) return null;
    const r = 70;
    const circ = 2 * Math.PI * r;

    let accumulatedPercent = 0;
    const slices = categoryStats.map((slice, index) => {
      const strokeDasharray = `${(slice.percentage / 100) * circ} ${circ}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circ);
      accumulatedPercent += slice.percentage;
      return {
        ...slice,
        strokeDasharray,
        strokeDashoffset,
        color: chartColors[index % chartColors.length]
      };
    });

    return { slices, r, circ };
  }, [categoryStats]);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            {...fadeUp(i * 0.08)}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
                <Icon size={22} />
              </div>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
            <p className="text-sm font-semibold text-gray-400 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ALERT CARDS ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div {...fadeUp(0.35)} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Đơn chờ xử lý</p>
            <p className="text-3xl font-black text-amber-700 mt-1">{stats.pendingOrders}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100/60 px-3 py-1.5 rounded-xl transition-colors">
            Xử lý ngay
          </Link>
        </motion.div>
        
        <motion.div {...fadeUp(0.40)} className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Đang giao hàng</p>
            <p className="text-3xl font-black text-blue-700 mt-1">{stats.processingOrders}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100/60 px-3 py-1.5 rounded-xl transition-colors">
            Xem ngay
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.45)} className="bg-red-50/50 border border-red-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={13} /> Sắp hết hàng
            </p>
            <p className="text-3xl font-black text-red-700 mt-1">{stats.lowStockProducts}</p>
          </div>
          <Link to="/admin/products" className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-100/60 px-3 py-1.5 rounded-xl transition-colors">
            Nhập hàng
          </Link>
        </motion.div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: Revenue over Time */}
        <motion.div {...fadeUp(0.5)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-gray-900">Doanh thu theo thời gian</h3>
              <p className="text-xs text-gray-500 mt-0.5">Biểu đồ doanh thu 30 ngày gần đây</p>
            </div>
            {hoveredPoint && (
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400">{hoveredPoint.date}</span>
                <p className="text-sm font-black text-emerald-600">{formatPrice(hoveredPoint.value)}</p>
              </div>
            )}
          </div>

          {lineChart ? (
            <div className="relative w-full aspect-[2.5/1]">
              <svg className="w-full h-full" viewBox={`0 0 ${lineChart.width} ${lineChart.height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="20" y1="20" x2="480" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="20" y1="80" x2="480" y2="80" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="20" y1="140" x2="480" y2="140" stroke="#e5e7eb" strokeWidth="1" />

                {/* Shaded Area */}
                <path d={lineChart.areaPath} fill="url(#areaGrad)" />

                {/* Line */}
                <path
                  d={lineChart.linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Active hover points */}
                {lineChart.points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? 6 : 4}
                    fill={hoveredPoint?.date === p.date ? '#10b981' : '#ffffff'}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm font-medium">Chưa đủ dữ liệu để vẽ biểu đồ</p>
          )}
        </motion.div>

        {/* Bar Chart: Orders per Day */}
        <motion.div {...fadeUp(0.55)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-gray-900">Số lượng đơn hàng</h3>
              <p className="text-xs text-gray-500 mt-0.5">Thống kê số đơn hàng 10 ngày gần đây</p>
            </div>
            {hoveredBar && (
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400">{hoveredBar.date}</span>
                <p className="text-sm font-black text-blue-600">{hoveredBar.value} đơn hàng</p>
              </div>
            )}
          </div>

          {barChart ? (
            <div className="relative w-full aspect-[2.5/1]">
              <svg className="w-full h-full" viewBox={`0 0 ${barChart.width} ${barChart.height}`} preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="20" y1="20" x2="480" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="20" y1="80" x2="480" y2="80" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="20" y1="140" x2="480" y2="140" stroke="#e5e7eb" strokeWidth="1" />

                {/* Bars */}
                {barChart.bars.map((bar, idx) => (
                  <rect
                    key={idx}
                    x={bar.x}
                    y={bar.y}
                    width={bar.w}
                    height={bar.h}
                    rx="4"
                    fill={hoveredBar?.date === bar.date ? '#2563eb' : '#3b82f6'}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredBar(bar)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm font-medium">Chưa có dữ liệu đơn hàng</p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Stats Donut Chart */}
        <motion.div {...fadeUp(0.6)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900">Cơ cấu ngành hàng</h3>
            <p className="text-xs text-gray-500 mt-0.5">Phân bố sản phẩm theo danh mục chính</p>
          </div>

          {donutChart ? (
            <div className="flex flex-col items-center py-6 justify-center">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 200 200">
                {donutChart.slices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="100"
                    cy="100"
                    r={donutChart.r}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="20"
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              <div className="w-full mt-6 space-y-2">
                {donutChart.slices.slice(0, 4).map((slice, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="text-gray-700 font-semibold truncate max-w-[120px]">{slice.name}</span>
                    </div>
                    <span className="text-gray-400 font-bold font-mono">
                      {slice.count} SP ({slice.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm font-medium">Chưa có dữ liệu danh mục</p>
          )}
        </motion.div>

        {/* Top Selling Products List */}
        <motion.div {...fadeUp(0.65)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900">Sản phẩm bán chạy nhất</h3>
            <p className="text-xs text-gray-500 mt-0.5">Top 5 sản phẩm có sản lượng cao nhất</p>
          </div>

          <div className="py-4 space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm font-medium">Chưa có dữ liệu bán chạy</p>
            ) : (() => {
              const maxSold = Math.max(...topProducts.map(p => p.soldCount), 1);
              return topProducts.map((p, idx) => {
                const percentage = (p.soldCount / maxSold) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                      <span className="truncate max-w-[300px]">{p.name}</span>
                      <span className="text-emerald-600">{formatPrice(p.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="text-xs font-extrabold text-gray-500 whitespace-nowrap min-w-[70px] text-right">
                        {p.soldCount} lượt bán
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <motion.div {...fadeUp(0.7)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold group">
              Quản lý đơn hàng <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có đơn hàng nào</p>
            )}
            {recentOrders.map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
              return (
                <div key={order.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">{order.customerName || 'Khách vãng lai'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{formatPrice(order.totalAmount)}</p>
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1 uppercase ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div {...fadeUp(0.75)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:col-span-1">
          <h3 className="font-bold text-gray-900 mb-5">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/admin/products/add"
              className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-md shadow-emerald-100">
              <Package size={15} /> Thêm sản phẩm mới
            </Link>
            <Link to="/admin/categories/add"
              className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-md shadow-blue-100">
              <Tag size={15} /> Thêm danh mục mới
            </Link>
            <Link to="/admin/customers"
              className="flex items-center justify-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition-colors">
              Xem danh sách khách hàng
            </Link>
            <Link to="/" target="_blank"
              className="flex items-center justify-center py-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 text-sm font-bold rounded-2xl transition-all">
              Xem trang mua sắm ↗
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Dashboard;
