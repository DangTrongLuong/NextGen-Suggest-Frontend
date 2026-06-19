import React, { useState, useEffect, useCallback } from 'react';
import { Database, Calendar, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { BASE_URL } from '../services/api';
import { useAnalyticsStore } from '../store/store';
import toast from 'react-hot-toast';

const TopProducts = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchTopProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getTopProducts(timeRange, 20);
      if (res.success) {
        setProductList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load top products:', err);
      toast.error('Lỗi khi tải danh sách sản phẩm phổ biến.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  const handleExport = () => {
    setExporting(true);
    try {
      const token = useAnalyticsStore.getState().accessToken;
      const downloadUrl = `${BASE_URL}/analytics/export/top-products?token=${token}&time_range=${timeRange}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `top_products_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đang bắt đầu tải xuống báo cáo sản phẩm...');
    } catch (e) {
      toast.error('Lỗi khi xuất danh sách.');
    } finally {
      setExporting(false);
    }
  };

  // ── Render Custom SVG chart for product appearance counts ──
  const renderProductChart = () => {
    const chartData = productList.slice(0, 8); // Top 8 items
    if (chartData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-xs text-slate-600">
          Chưa có dữ liệu biểu đồ sản phẩm
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const paddingLeft = 120; // larger padding for long product titles
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...chartData.map(d => d.appearance_count), 5);
    const rowHeight = chartHeight / chartData.length;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="emerald-bar-horizontal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {chartData.map((d, i) => {
          const y = paddingTop + i * rowHeight + rowHeight * 0.15;
          const barWidth = (d.appearance_count / maxVal) * chartWidth;
          const barHeight = rowHeight * 0.7;
          
          // Truncate product name for label
          const label = d.product_name.length > 18 ? d.product_name.substring(0, 15) + '...' : d.product_name;

          return (
            <g key={i} className="group cursor-pointer">
              {/* Product Label */}
              <text 
                x={paddingLeft - 10} 
                y={y + barHeight / 2} 
                textAnchor="end" 
                alignmentBaseline="middle"
                className="fill-slate-400 text-[9px] font-bold"
              >
                {label}
              </text>
              
              {/* Horizontal Bar */}
              <rect 
                x={paddingLeft} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                rx={1.5}
                fill="url(#emerald-bar-horizontal)"
                className="hover:fill-emerald-400 transition-colors"
              />

              {/* Value Count Label */}
              <text 
                x={paddingLeft + barWidth + 8} 
                y={y + barHeight / 2} 
                alignmentBaseline="middle"
                className="fill-emerald-400 text-[9px] font-black"
              >
                {d.appearance_count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        {/* Time filters */}
        <div className="flex items-center bg-slate-950/50 border border-slate-800 rounded-xl px-1 py-1">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                timeRange === range 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || productList.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/50 border border-slate-800 hover:bg-slate-800/40 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Download size={14} /> XUẤT EXCEL/CSV
          </button>
          
          <button
            onClick={fetchTopProducts}
            disabled={loading}
            className="p-2.5 bg-slate-950/50 border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Visual and Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SVG Horizontal Chart (take 1 column) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-emerald-500" size={16} />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tần suất hiển thị Top 8</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mb-6">
              Số lần sản phẩm xuất hiện trong kết quả tìm kiếm của khách hàng.
            </p>
          </div>
          <div className="h-48 w-full relative">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="animate-spin text-emerald-500" size={20} />
              </div>
            ) : (
              renderProductChart()
            )}
          </div>
        </div>

        {/* Top Products Table (take 2 columns) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="text-emerald-500" size={16} />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bảng xếp hạng hiển thị sản phẩm</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80">
                  <th className="pb-3 font-semibold">TÊN SẢN PHẨM / SKUS</th>
                  <th className="pb-3 font-semibold text-center">TẦN SUẤT HIỆN</th>
                  <th className="pb-3 font-semibold text-center">XẾP HẠNG TB</th>
                  <th className="pb-3 font-semibold text-center">CLICKS</th>
                  <th className="pb-3 font-semibold">XUẤT HIỆN CUỐI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      Đang đồng bộ danh sách sản phẩm...
                    </td>
                  </tr>
                ) : productList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-600 font-medium">
                      Không ghi nhận dữ liệu hiển thị sản phẩm trong khoảng thời gian này.
                    </td>
                  </tr>
                ) : (
                  productList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/10">
                      {/* Product details */}
                      <td className="py-3.5 pr-4 min-w-[200px]">
                        <p className="font-bold text-slate-200 line-clamp-1">{item.product_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {item.product_id}</p>
                      </td>
                      
                      {/* Appearance frequency */}
                      <td className="py-3.5 text-center font-bold text-slate-300">
                        {item.appearance_count} lần
                      </td>

                      {/* Average ranking score */}
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          item.average_ranking <= 2 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-slate-850 border border-slate-800 text-slate-400'
                        }`}>
                          #{item.average_ranking}
                        </span>
                      </td>

                      {/* Click totals */}
                      <td className="py-3.5 text-center font-bold text-violet-400">
                        {item.click_count || 0}
                      </td>

                      {/* Last appearance date */}
                      <td className="py-3.5 text-slate-400 font-semibold">
                        {new Date(item.last_appeared).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TopProducts;
