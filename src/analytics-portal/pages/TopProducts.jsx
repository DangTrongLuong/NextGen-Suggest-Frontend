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

  // ── Render Top 8 Product Appearance Chart ──
  const renderProductChart = () => {
    const chartData = productList.slice(0, 8); // Top 8 items
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-xs text-slate-600 font-medium">
          Chưa có dữ liệu hiển thị sản phẩm
        </div>
      );
    }

    const maxVal = Math.max(...chartData.map((d) => d.appearance_count), 1);

    return (
      <div className="flex-1 flex flex-col justify-between gap-4 py-2">
        {chartData.map((item, index) => {
          const percentage = Math.min(100, Math.max(10, (item.appearance_count / maxVal) * 100));
          const isTop3 = index < 3;

          return (
            <div key={index} className="group space-y-1.5">
              {/* Product Label & Count */}
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      index === 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : index === 1
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                        : index === 2
                        ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                        : 'bg-slate-850 text-slate-400 border border-slate-800'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className="font-bold text-slate-200 truncate text-xs group-hover:text-emerald-400 transition-colors"
                    title={item.product_name}
                  >
                    {item.product_name}
                  </span>
                </div>

                <span className="font-black text-xs text-emerald-400 shrink-0">
                  {item.appearance_count} <span className="text-[10px] font-semibold text-slate-500">lần</span>
                </span>
              </div>

              {/* Gradient Progress Bar */}
              <div className="h-2.5 w-full bg-slate-950/80 border border-slate-800/80 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTop3
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-emerald-700 to-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Horizontal Progress Chart (take 1 column) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-emerald-500" size={16} />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tần suất hiển thị Top 8</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mb-6">
              Số lần sản phẩm xuất hiện trong kết quả tìm kiếm của khách hàng.
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
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
