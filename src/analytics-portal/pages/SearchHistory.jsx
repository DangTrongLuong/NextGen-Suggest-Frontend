import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Calendar, Filter, Download, ArrowUpDown, 
  ArrowUp, ArrowDown, X, Info, ChevronLeft, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { useAnalyticsStore } from '../store/store';
import { analyticsService } from '../services/analyticsService';
import { BASE_URL } from '../services/api';
import toast from 'react-hot-toast';

const SearchHistory = () => {
  // Query state
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [zeroResults, setZeroResults] = useState(false);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('searched_at');
  const [sortDesc, setSortDesc] = useState(true);
  
  // Data state
  const [historyList, setHistoryList] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Detail Drawer State
  const [selectedLog, setSelectedLog] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: q.trim() || undefined,
        start: startDate ? new Date(startDate).toISOString() : undefined,
        end: endDate ? new Date(endDate).toISOString() : undefined,
        zero_results: zeroResults,
        page,
        size: 15,
        sort_by: sortBy,
        sort_desc: sortDesc
      };

      const res = await analyticsService.getHistory(params);
      if (res.success) {
        setHistoryList(res.data.content || []);
        setTotalElements(res.data.total_elements || 0);
        setTotalPages(res.data.total_pages || 0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      toast.error('Lỗi khi tải lịch sử tìm kiếm.');
    } finally {
      setLoading(false);
    }
  }, [q, startDate, endDate, zeroResults, page, sortBy, sortDesc]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchHistory();
  };

  const handleResetFilters = () => {
    setQ('');
    setStartDate('');
    setEndDate('');
    setZeroResults(false);
    setPage(0);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
    setPage(0);
  };

  const handleRowClick = async (logId) => {
    setDetailLoading(true);
    setDrawerOpen(true);
    try {
      const res = await analyticsService.getDetail(logId);
      if (res.success) {
        setSelectedLog(res.data);
      }
    } catch (err) {
      console.error('Error fetching log detail:', err);
      toast.error('Không thể tải chi tiết yêu cầu.');
      setDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const qParam = q ? `&q=${encodeURIComponent(q)}` : '';
      const startParam = startDate ? `&start=${encodeURIComponent(new Date(startDate).toISOString())}` : '';
      const endParam = endDate ? `&end=${encodeURIComponent(new Date(endDate).toISOString())}` : '';
      const token = useAnalyticsStore.getState().accessToken;

      // In order to download the file directly, we build the link
      const downloadUrl = `${BASE_URL}/analytics/export/history?token=${token}${qParam}${startParam}${endParam}`;
      
      // Perform direct anchor download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'search_history.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đang khởi tạo tải xuống báo cáo...');
    } catch (err) {
      toast.error('Lỗi khi xuất dữ liệu.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* ── Filter Form Toolbar ── */}
      <form onSubmit={handleSearchSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm từ khóa..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/80"
            />
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/80"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/80"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Filter size={14} /> LỌC KẾT QUẢ
            </button>
            
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2.5 bg-slate-950/50 border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              RESET
            </button>
          </div>
        </div>

        {/* Checkbox toggles */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 font-medium">
            <input
              type="checkbox"
              checked={zeroResults}
              onChange={(e) => setZeroResults(e.target.checked)}
              className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            Chỉ hiển thị tìm kiếm không có kết quả (Zero Results)
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || historyList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950/50 border border-slate-800 hover:bg-slate-800/40 disabled:opacity-40 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Download size={14} /> XUẤT CSV (STREAM)
          </button>
        </div>
      </form>

      {/* ── Data History Table ── */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800/80 bg-slate-900/20">
                <th className="p-4 font-bold cursor-pointer hover:text-slate-200 select-none" onClick={() => toggleSort('searched_at')}>
                  <div className="flex items-center gap-1.5">
                    THỜI GIAN
                    {sortBy === 'searched_at' ? (sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:text-slate-200 select-none" onClick={() => toggleSort('keyword')}>
                  <div className="flex items-center gap-1.5">
                    TỪ KHÓA
                    {sortBy === 'keyword' ? (sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:text-slate-200 select-none text-center" onClick={() => toggleSort('response_time_ms')}>
                  <div className="flex items-center justify-center gap-1.5">
                    ĐỘ TRỄ (ms)
                    {sortBy === 'response_time_ms' ? (sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th className="p-4 font-bold cursor-pointer hover:text-slate-200 select-none text-center" onClick={() => toggleSort('total_results')}>
                  <div className="flex items-center justify-center gap-1.5">
                    KẾT QUẢ
                    {sortBy === 'total_results' ? (sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th className="p-4 font-bold text-center">CLICKS</th>
                <th className="p-4 font-bold">SESSION ID</th>
                <th className="p-4 font-bold text-center">CHI TIẾT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    <RefreshCw className="animate-spin text-emerald-500 inline mr-2" size={16} />
                    Đang tải dữ liệu lịch sử tìm kiếm...
                  </td>
                </tr>
              ) : historyList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-600 font-medium">
                    Không tìm thấy bản ghi tìm kiếm phù hợp.
                  </td>
                </tr>
              ) : (
                historyList.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-800/10 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(log.id)}
                  >
                    <td className="p-4 text-slate-400 font-semibold">{new Date(log.searched_at).toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-200">"{log.keyword}"</td>
                    <td className={`p-4 text-center font-bold ${log.response_time_ms > 2000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {log.response_time_ms}ms
                    </td>
                    <td className={`p-4 text-center font-bold ${log.total_results === 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                      {log.total_results}
                    </td>
                    <td className="p-4 text-center">
                      {log.clicks?.length > 0 ? (
                        <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black rounded-md">
                          {log.clicks.length} CLICKS
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-500">{log.session_id.substring(0, 12)}...</td>
                    <td className="p-4 text-center">
                      <button 
                        className="p-1.5 bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); handleRowClick(log.id); }}
                      >
                        <Info size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800/80 bg-slate-900/10">
            <span className="text-xs text-slate-500 font-semibold">
              Tổng số: <b className="text-slate-300 font-bold">{totalElements}</b> kết quả
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={page === 0 || loading}
                className="p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 disabled:opacity-30 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-300 font-bold">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 disabled:opacity-30 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Drawer Slider ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          
          {/* Drawer Panel */}
          <div className="w-full max-w-lg bg-[#070b13] border-l border-slate-800/85 h-full relative z-10 flex flex-col p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Chi tiết phiên tìm kiếm</h3>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                <RefreshCw className="animate-spin text-emerald-500" size={24} />
                <span className="text-xs">Đang tải chi tiết kết quả...</span>
              </div>
            ) : selectedLog ? (
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-xs">
                {/* General Query details */}
                <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Từ khóa:</span>
                    <span className="font-bold text-slate-100 text-sm">"{selectedLog.keyword}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Mã yêu cầu (UUID):</span>
                    <span className="font-mono text-slate-300">{selectedLog.request_id || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Thời gian phản hồi:</span>
                    <span className={`font-bold ${selectedLog.response_time_ms > 2000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedLog.response_time_ms}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Số sản phẩm khớp:</span>
                    <span className="font-bold text-slate-200">{selectedLog.total_results} sản phẩm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Session ID:</span>
                    <span className="font-mono text-slate-400">{selectedLog.session_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Thời gian tìm kiếm:</span>
                    <span className="text-slate-300 font-semibold">{new Date(selectedLog.searched_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Returned products rankings list */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider">Danh sách sản phẩm và thứ tự hiển thị</h4>
                  {selectedLog.products?.length === 0 ? (
                    <p className="text-slate-600 text-center py-4 bg-slate-900/10 rounded-xl border border-slate-850">
                      Không có sản phẩm nào được trả về (Zero Results)
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedLog.products.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/50 border border-slate-900/80 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`h-6 w-6 rounded-lg font-bold flex items-center justify-center text-[10px] ${
                              p.ranking_position === 1 
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                : 'bg-slate-800/40 text-slate-400 border border-slate-800'
                            }`}>
                              #{p.ranking_position}
                            </span>
                            <span className="font-bold text-slate-200">{p.product_name}</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-600">ID: {p.product_id.substring(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Click logs recorded */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider">Hành vi người dùng (Clicks)</h4>
                  {selectedLog.clicks?.length === 0 ? (
                    <p className="text-slate-600 text-center py-4 bg-slate-900/10 rounded-xl border border-slate-850">
                      Người dùng không click vào bất kỳ sản phẩm nào trong kết quả này.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedLog.clicks.map((c, idx) => (
                        <div key={idx} className="p-3 bg-violet-500/5 border border-violet-500/10 text-violet-300 rounded-xl flex items-start gap-3">
                          <Zap size={14} className="mt-0.5 text-violet-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-200">Đã click: {c.product_name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Thời gian: {new Date(c.clicked_at).toLocaleTimeString()} ({new Date(c.clicked_at).toLocaleDateString()})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchHistory;
