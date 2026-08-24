import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Users, Package,
  TrendingUp, ArrowRight, Tag, AlertTriangle, ChevronRight, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';
import { ORDER_STATUS_MAP } from '../../utils/orderStatus';
import { Spinner } from '../../components/common/Loading';

const colorMap = {
  emerald: 'bg-slate-100 text-slate-900 border-slate-200',
  blue: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  purple: 'bg-slate-100 text-slate-800 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
};

const chartColors = [
  '#0f172a', // Slate 900
  '#10b981', // Emerald 500
  '#64748b', // Slate 500
  '#f59e0b', // Amber 500
  '#ec4899', // Pink 500
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.2 },
});

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // '24h' | '7d' | '30d' | '12m'

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

  // Filter revenue data by selected time range
  const filteredRevenueData = useMemo(() => {
    if (!revenueChartData || revenueChartData.length === 0) return [];
    if (timeRange === '24h') {
      return revenueChartData.slice(-2);
    }
    if (timeRange === '7d') {
      return revenueChartData.slice(-7);
    }
    if (timeRange === '12m') {
      return revenueChartData;
    }
    return revenueChartData.slice(-30);
  }, [revenueChartData, timeRange]);

  const totalRevenueInPeriod = useMemo(() => {
    return filteredRevenueData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  }, [filteredRevenueData]);

  const lineChart = useMemo(() => {
    if (filteredRevenueData.length === 0) return null;
    const width = 500;
    const height = 160;
    const padding = 20;

    const maxVal = Math.max(...filteredRevenueData.map(d => d.revenue), 100000);

    const points = filteredRevenueData.map((d, index) => {
      const divisor = filteredRevenueData.length > 1 ? filteredRevenueData.length - 1 : 1;
      const x = padding + (index / divisor) * (width - 2 * padding);
      const y = height - padding - (d.revenue / maxVal) * (height - 2 * padding);
      return { x, y, date: d.date, value: d.revenue };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { points, linePath, areaPath, width, height, maxVal };
  }, [filteredRevenueData]);

  const barChart = useMemo(() => {
    const data = revenueChartData.slice(-10);
    if (data.length === 0) return null;
    const width = 500;
    const height = 160;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => d.orders), 5);

    const bars = data.map((d, index) => {
      const colWidth = (width - 2 * padding) / data.length;
      const x = padding + index * colWidth + 4;
      const barHeight = (d.orders / maxVal) * (height - 2 * padding);
      const y = height - padding - barHeight;
      return {
        x,
        y,
        w: colWidth - 8,
        h: Math.max(barHeight, 2),
        date: d.date,
        value: d.orders
      };
    });

    return { bars, width, height, maxVal };
  }, [revenueChartData]);

  // Clean Grouped Category Donut Chart (Top 4 + Others)
  const groupedCategoryChart = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return null;

    const sorted = [...categoryStats].sort((a, b) => b.count - a.count);
    const totalCountAll = sorted.reduce((sum, item) => sum + item.count, 0);

    let topSlices = [];
    if (sorted.length <= 4) {
      topSlices = sorted;
    } else {
      const mainSlices = sorted.slice(0, 4);
      const otherCount = sorted.slice(4).reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = totalCountAll > 0 ? parseFloat(((otherCount / totalCountAll) * 100).toFixed(1)) : 0;

      topSlices = [
        ...mainSlices,
        { name: 'Các danh mục khác', count: otherCount, percentage: otherPercentage }
      ];
    }

    const r = 64;
    const circ = 2 * Math.PI * r;
    let accumulatedPercent = 0;

    const slices = topSlices.map((slice, index) => {
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

    return { slices, r, circ, totalProducts: totalCountAll };
  }, [categoryStats]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng doanh thu', value: formatPrice(stats.totalRevenue || 0), icon: DollarSign, color: 'emerald' },
    { label: 'Tổng đơn hàng', value: stats.totalOrders, icon: ShoppingBag, color: 'blue' },
    { label: 'Khách hàng', value: stats.totalCustomers, icon: Users, color: 'purple' },
    { label: 'Tổng sản phẩm', value: stats.totalProducts, icon: Package, color: 'amber' },
  ];

  const timeFilterButtons = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7 Ngày' },
    { key: '30d', label: '30 Ngày' },
    { key: '12m', label: 'Tất cả' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            {...fadeUp(i * 0.05)}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
                <Icon size={18} />
              </div>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alert Banners */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div {...fadeUp(0.2)} className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-card">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Đơn chờ xử lý</p>
            <p className="text-2xl font-extrabold text-amber-900 mt-0.5">{stats.pendingOrders}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
            Xử lý
          </Link>
        </motion.div>
        
        <motion.div {...fadeUp(0.25)} className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-card">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Đang giao hàng</p>
            <p className="text-2xl font-extrabold text-emerald-900 mt-0.5">{stats.processingOrders}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors">
            Xem ngay
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between shadow-card">
          <div>
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={13} /> Sắp hết hàng
            </p>
            <p className="text-2xl font-extrabold text-rose-900 mt-0.5">{stats.lowStockProducts}</p>
          </div>
          <Link to="/admin/products" className="text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors">
            Nhập kho
          </Link>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Line Chart with 24h / 7d / 30d / 12m filters */}
        <motion.div {...fadeUp(0.35)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Doanh thu</h3>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {formatPrice(totalRevenueInPeriod)}
                </span>
              </div>
            </div>

            {/* Time Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              {timeFilterButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setTimeRange(btn.key)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    timeRange === btn.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {hoveredPoint && (
            <div className="mb-2 text-right">
              <span className="text-[10px] font-bold text-slate-400">{hoveredPoint.date}</span>
              <p className="text-xs font-extrabold text-slate-900">{formatPrice(hoveredPoint.value)}</p>
            </div>
          )}

          {lineChart ? (
            <div className="relative w-full aspect-[2.5/1]">
              <svg className="w-full h-full" viewBox={`0 0 ${lineChart.width} ${lineChart.height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="20" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                <path d={lineChart.areaPath} fill="url(#areaGrad)" />
                <path d={lineChart.linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {lineChart.points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? 5 : 3}
                    fill={hoveredPoint?.date === p.date ? '#10b981' : '#ffffff'}
                    stroke="#10b981"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-12 text-xs font-medium">Chưa phát sinh doanh thu trong khoảng thời gian này</p>
          )}
        </motion.div>

        {/* Orders Bar Chart */}
        <motion.div {...fadeUp(0.4)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Số đơn 10 ngày gần nhất</h3>
            </div>
            {hoveredBar && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400">{hoveredBar.date}</span>
                <p className="text-xs font-extrabold text-slate-900">{hoveredBar.value} đơn hàng</p>
              </div>
            )}
          </div>

          {barChart ? (
            <div className="relative w-full aspect-[2.5/1]">
              <svg className="w-full h-full" viewBox={`0 0 ${barChart.width} ${barChart.height}`} preserveAspectRatio="none">
                <line x1="20" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                {barChart.bars.map((bar, idx) => (
                  <rect
                    key={idx}
                    x={bar.x}
                    y={bar.y}
                    width={bar.w}
                    height={bar.h}
                    rx="3"
                    fill={hoveredBar?.date === bar.date ? '#10b981' : '#0f172a'}
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredBar(bar)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-12 text-xs font-medium">Chưa có dữ liệu đơn hàng</p>
          )}
        </motion.div>
      </div>

      {/* Secondary Row: Category Structure & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Redesigned Clean Category Donut Chart (Top 4 + Others) */}
        <motion.div {...fadeUp(0.45)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Cơ cấu danh mục</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Phân bổ sản phẩm theo nhóm danh mục chính</p>
          </div>

          {groupedCategoryChart ? (
            <div className="flex flex-col items-center py-4 justify-center">
              
              {/* Donut with Total Products in Center */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {groupedCategoryChart.slices.map((slice, idx) => (
                    <circle
                      key={idx}
                      cx="100"
                      cy="100"
                      r={groupedCategoryChart.r}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="16"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  ))}
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">
                    {groupedCategoryChart.totalProducts}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                    Sản phẩm
                  </span>
                </div>
              </div>

              {/* Clean Legend List */}
              <div className="w-full mt-5 space-y-2">
                {groupedCategoryChart.slices.map((slice, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="text-slate-800 font-semibold truncate max-w-[140px]">{slice.name}</span>
                    </div>
                    <span className="text-slate-600 font-bold shrink-0">
                      {slice.count} SP <span className="text-slate-400 font-normal">({slice.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <p className="text-center text-slate-400 py-12 text-xs font-medium">Chưa có dữ liệu danh mục</p>
          )}
        </motion.div>

        {/* Top Selling Products List */}
        <motion.div {...fadeUp(0.5)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-3">Top bán chạy nhất</h3>
          </div>

          <div className="space-y-3.5">
            {topProducts.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-xs font-medium">Chưa có dữ liệu bán chạy</p>
            ) : (() => {
              const maxSold = Math.max(...topProducts.map(p => p.soldCount), 1);
              return topProducts.map((p, idx) => {
                const percentage = (p.soldCount / maxSold) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="truncate max-w-[280px]">{p.name}</span>
                      <span className="text-slate-900 font-extrabold">{formatPrice(p.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-emerald-600 rounded-full"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
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

      {/* Bottom Row: Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div {...fadeUp(0.55)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              Quản lý đơn hàng <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có đơn hàng nào</p>
            )}
            {recentOrders.map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
              return (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl border border-slate-100 transition-colors text-xs">
                  <div>
                    <p className="font-bold text-slate-900">#{order.orderNumber}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{order.customerName || 'Khách vãng lai'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 uppercase ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.6)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 lg:col-span-1">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 gap-2 text-xs font-bold">
            <Link to="/admin/products/add"
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-xs uppercase tracking-wider">
              <Package size={14} /> Thêm sản phẩm
            </Link>
            <Link to="/admin/categories/add"
              className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl transition-colors uppercase tracking-wider">
              <Tag size={14} /> Thêm danh mục
            </Link>
            <Link to="/admin/customers"
              className="flex items-center justify-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors uppercase tracking-wider">
              Danh sách khách hàng
            </Link>
            <Link to="/" target="_blank"
              className="flex items-center justify-center py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors">
              Xem trang mua sắm ↗
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Dashboard;
