import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Clock, AlertTriangle, TrendingUp, 
  Activity, RefreshCw, Calendar, ArrowUpRight, Zap 
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useAnalyticsStore } from '../store/store';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [kpis, setKpis] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topKeywords, setTopKeywords] = useState([]);
  const [realtimeFeed, setRealtimeFeed] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isConnected, alerts, setAlerts } = useAnalyticsStore();

  const fetchDashboardData = useCallback(async (showRefreshingIndicator = false) => {
    if (showRefreshingIndicator) setRefreshing(true);
    else setDbLoading(true);

    try {
      // 1. Fetch overview (KPIs + Timeline)
      const overviewRes = await analyticsService.getOverview(timeRange);
      if (overviewRes.success) {
        setKpis(overviewRes.data.kpis);
        setTimeline(overviewRes.data.timeline || []);
        setAlerts(overviewRes.data.alerts || []);
      }

      // 2. Fetch top keywords
      const keywordsRes = await analyticsService.getTopKeywords(timeRange, 5);
      if (keywordsRes.success) {
        setTopKeywords(keywordsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      toast.error('Không thể kết nối đến cơ sở dữ liệu giám sát.');
    } finally {
      setDbLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, setAlerts]);

  // Fetch on time range change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Hook into global WebSocket state to update live searches feed
  // Whenever the worker broadcasts a new search log, it triggers our listener.
  // Since useWebSocket is already active in AnalyticsLayout, we can listen for custom storage events or dispatch events,
  // or we can just run the hook directly here as well! It's very safe to run multiple sockets or listen to a single window event.
  // Let's implement window event listener for WS messages dispatched by layout, OR simply run useWebSocket hook!
  // To avoid duplicate connections, the easiest way is to let Dashboard register an event listener on window.
  // Inside useWebSocket (in layout), we can dispatch a custom event: `window.dispatchEvent(new CustomEvent('ws-search', { detail: message.data }));`
  // That is extremely clean and avoids creating multiple WS connections!
  // Let's check: Yes! We can listen to 'ws-search' events.
  useEffect(() => {
    const handleNewSearch = (e) => {
      const newSearch = e.detail;
      if (!newSearch) return;

      // Prepend to realtime feed (keep last 6 items)
      setRealtimeFeed((prev) => [newSearch, ...prev].slice(0, 6));

      // Auto-increment local KPIs for real-time visual feedback!
      setKpis((prev) => {
        if (!prev) return null;
        const total = prev.total_searches + 1;
        const today = prev.searches_today + 1;
        const zeroCount = newSearch.total_results === 0 ? prev.zero_result_searches + 1 : prev.zero_result_searches;
        const zeroRate = (zeroCount / total) * 100;
        
        return {
          ...prev,
          total_searches: total,
          searches_today: today,
          zero_result_searches: zeroCount,
          zero_result_rate: round(zeroRate, 2),
        };
      });
    };

    window.addEventListener('ws-search-log', handleNewSearch);
    return () => window.removeEventListener('ws-search-log', handleNewSearch);
  }, []);

  const round = (val, dec) => Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);

  // ── Custom SVG Line Chart Drawing ──
  const renderLineChart = () => {
    if (!timeline || timeline.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-xs text-slate-600">
          Chưa có dữ liệu biểu đồ
        </div>
      );
    }

    const width = 500;
    const height = 160;
    const padding = 20;

    const xMax = width - padding * 2;
    const yMax = height - padding * 2;

    const maxVal = Math.max(...timeline.map(d => d.search_count), 5);

    // Compute coordinates
    const points = timeline.map((d, index) => {
      const x = padding + (index / (timeline.length - 1 || 1)) * xMax;
      const y = height - padding - (d.search_count / maxVal) * yMax;
      return { x, y, value: d.search_count, label: d.time_bucket.split(' ').pop() };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = timeline.length > 0 
      ? `${linePath} L ${points[points.length-1].x} ${height-padding} L ${points[0].x} ${height-padding} Z` 
      : '';

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="emerald-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="emerald-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line 
            key={i} 
            x1={padding} 
            y1={padding + r * yMax} 
            x2={width - padding} 
            y2={padding + r * yMax} 
            stroke="#1e293b" 
            strokeWidth="0.5" 
            strokeDasharray="4 4" 
          />
        ))}

        {/* Areas & Lines */}
        {areaPath && <path d={areaPath} fill="url(#emerald-area-grad)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#emerald-line-grad)" strokeWidth="2.5" strokeLinecap="round" />}

        {/* Circle Dots on Hover/Static */}
        {points.map((p, i) => (
          <g key={i} className="group/dot cursor-pointer">
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="3.5" 
              className="fill-[#070b13] stroke-emerald-400 stroke-[2] hover:r-5 hover:fill-emerald-400 transition-all"
            />
            {/* Tooltip text */}
            <text 
              x={p.x} 
              y={p.y - 10} 
              textAnchor="middle" 
              className="hidden group-hover/dot:block fill-slate-200 text-[10px] font-bold bg-slate-900 px-1 rounded"
            >
              {p.value}
            </text>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.filter((_, idx) => idx % Math.max(1, Math.floor(timeline.length / 5)) === 0).map((p, i) => (
          <text 
            key={i} 
            x={p.x} 
            y={height - 2} 
            textAnchor="middle" 
            className="fill-slate-500 text-[8px] font-bold"
          >
            {p.label}
          </text>
        ))}
      </svg>
    );
  };

  // ── Custom SVG Bar Chart Drawing (Latency) ──
  const renderBarChart = () => {
    if (!timeline || timeline.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-xs text-slate-600">
          Chưa có dữ liệu biểu đồ
        </div>
      );
    }

    const width = 500;
    const height = 160;
    const padding = 20;

    const xMax = width - padding * 2;
    const yMax = height - padding * 2;

    const maxVal = Math.max(...timeline.map(d => d.avg_latency), 50);
    const barWidth = Math.max(4, (xMax / timeline.length) * 0.6);

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="blue-bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line 
            key={i} 
            x1={padding} 
            y1={padding + r * yMax} 
            x2={width - padding} 
            y2={padding + r * yMax} 
            stroke="#1e293b" 
            strokeWidth="0.5" 
            strokeDasharray="4 4" 
          />
        ))}

        {/* Bars */}
        {timeline.map((d, index) => {
          const x = padding + (index / (timeline.length - 1 || 1)) * xMax - barWidth / 2;
          const barHeight = (d.avg_latency / maxVal) * yMax;
          const y = height - padding - barHeight;

          return (
            <g key={index} className="group/bar cursor-pointer">
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={Math.max(2, barHeight)} 
                rx={Math.min(2, barWidth / 2)}
                fill="url(#blue-bar-grad)"
                className="hover:fill-blue-400 transition-colors"
              />
              <text 
                x={x + barWidth / 2} 
                y={y - 8} 
                textAnchor="middle" 
                className="hidden group-hover/bar:block fill-slate-200 text-[10px] font-bold"
              >
                {Math.round(d.avg_latency)}ms
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {timeline.filter((_, idx) => idx % Math.max(1, Math.floor(timeline.length / 5)) === 0).map((d, i) => {
          const index = timeline.indexOf(d);
          const x = padding + (index / (timeline.length - 1 || 1)) * xMax;
          const label = d.time_bucket.split(' ').pop();
          return (
            <text 
              key={i} 
              x={x} 
              y={height - 2} 
              textAnchor="middle" 
              className="fill-slate-500 text-[8px] font-bold"
            >
              {label}
            </text>
          );
        })}
      </svg>
    );
  };

  if (dbLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin text-emerald-500 mb-4" size={32} />
        <p className="text-xs font-semibold tracking-wider uppercase">Đang đồng bộ dữ liệu giám sát...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* ── Page Toolbar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dữ liệu thời gian thực</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl px-1 py-1">
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

          {/* Refresh Button */}
          <button 
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total searches */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng lượt tìm kiếm</p>
              <h3 className="text-2xl font-black text-slate-200 mt-2">{kpis?.total_searches?.toLocaleString()}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-glow-sm">
              <Search size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
            <TrendingUp size={12} className="text-emerald-400" />
            <span>Hôm nay: <b className="text-slate-300 font-bold">{kpis?.searches_today}</b> lượt</span>
          </div>
        </div>

        {/* Card 2: Latency */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Độ trễ trung bình</p>
              <h3 className="text-2xl font-black text-slate-200 mt-2">{kpis?.average_response_time_ms}ms</h3>
            </div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-glow-sm ${
              kpis?.average_response_time_ms > 2000 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px]">
            {kpis?.average_response_time_ms > 2000 ? (
              <span className="text-rose-400 font-bold uppercase tracking-widest">⚠️ Lateny Alert</span>
            ) : (
              <span className="text-emerald-400 font-bold uppercase tracking-widest">✓ System Stable</span>
            )}
          </div>
        </div>

        {/* Card 3: Zero results */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tỷ lệ không kết quả</p>
              <h3 className="text-2xl font-black text-slate-200 mt-2">{kpis?.zero_result_rate}%</h3>
            </div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-glow-sm ${
              kpis?.zero_result_rate > 20
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' 
                : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
            }`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
            <span>Tổng số: <b className="text-slate-300 font-bold">{kpis?.zero_result_searches}</b> lượt không ra sản phẩm</span>
          </div>
        </div>

        {/* Card 4: CTR */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tỷ lệ click chuột (CTR)</p>
              <h3 className="text-2xl font-black text-slate-200 mt-2">{kpis?.ctr}%</h3>
            </div>
            <div className="h-10 w-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 shadow-glow-sm">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
            <span>Tỷ lệ tìm kiếm có click: <b className="text-slate-300 font-bold">{kpis?.search_to_click_rate}%</b></span>
          </div>
        </div>

      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search Volume */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Lượng tìm kiếm theo thời gian</h4>
            <span className="text-[10px] text-slate-500 font-bold">LƯỢT TÌM KIẾM</span>
          </div>
          <div className="h-48 w-full relative">
            {renderLineChart()}
          </div>
        </div>

        {/* Search Latency */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Độ trễ phản hồi trung bình</h4>
            <span className="text-[10px] text-slate-500 font-bold">ĐỘ TRỄ (ms)</span>
          </div>
          <div className="h-48 w-full relative">
            {renderBarChart()}
          </div>
        </div>
      </div>

      {/* ── Table Scoreboard and Live Logs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top 5 Keywords */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">Top từ khóa phổ biến</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80">
                  <th className="pb-3 font-semibold">TỪ KHÓA</th>
                  <th className="pb-3 font-semibold text-center">TÌM KIẾM</th>
                  <th className="pb-3 font-semibold text-center">TRỐNG KẾT QUẢ</th>
                  <th className="pb-3 font-semibold text-center">CTR (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {topKeywords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-600">Chưa có dữ liệu từ khóa</td>
                  </tr>
                ) : (
                  topKeywords.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/10">
                      <td className="py-3 font-medium text-slate-200 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold">{idx + 1}.</span>
                        {item.keyword}
                      </td>
                      <td className="py-3 text-center font-semibold text-slate-300">{item.search_count}</td>
                      <td className={`py-3 text-center font-semibold ${item.zero_result_count > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                        {item.zero_result_count}
                      </td>
                      <td className="py-3 text-center text-emerald-400 font-bold">{item.ctr}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Realtime logs feed */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Luồng tìm kiếm trực tiếp</h4>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              <Zap className="h-3 w-3 animate-pulse" />
              <span>REALTIME ON</span>
            </div>
          </div>
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {realtimeFeed.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-600 gap-2">
                <Activity className="animate-pulse text-slate-800" size={24} />
                <span className="text-xs">Đang chờ sự kiện tìm kiếm mới từ khách hàng...</span>
              </div>
            ) : (
              realtimeFeed.map((log, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-700/80 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">"{log.keyword}"</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Session: <span className="font-mono text-slate-400">{log.session_id.substring(0, 10)}...</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    <div>
                      <p className="font-semibold text-slate-300">{log.total_results} sản phẩm</p>
                      <p className={`text-[10px] mt-0.5 font-bold ${log.response_time_ms > 2000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {log.response_time_ms}ms
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
