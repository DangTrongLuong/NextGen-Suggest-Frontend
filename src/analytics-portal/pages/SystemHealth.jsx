import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, AlertOctagon, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import toast from 'react-hot-toast';

const SystemHealth = () => {
  const [statuses, setStatuses] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalElements, setAuditTotalElements] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuditLogs = useCallback(async (pageIndex = 0) => {
    setLogsLoading(true);
    try {
      const res = await analyticsService.getAuditLogs(pageIndex, 20);
      if (res.success) {
        setAuditLogs(res.data.content || []);
        setAuditTotalElements(res.data.total_elements || 0);
        setAuditTotalPages(res.data.total_pages || 0);
        setAuditPage(res.data.page || 0);
      }
    } catch (err) {
      console.error('Lỗi khi tải nhật ký hoạt động:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch system components health (FastAPI, Spring Boot, MySQL, Redis, Qdrant, RabbitMQ)
      const statusRes = await analyticsService.getSystemStatus();
      if (statusRes.success) {
        setStatuses(statusRes.data);
      }

      // 2. Fetch paginated security audit logs (20 items per page)
      await fetchAuditLogs(0);
    } catch (err) {
      console.error('Failed to query health check status:', err);
      toast.error('Lỗi khi kiểm tra sức khỏe hệ thống.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAuditLogs]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < auditTotalPages) {
      fetchAuditLogs(newPage);
    }
  };

  const getStatusColorClass = (statusStr) => {
    if (statusStr === 'healthy') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (statusStr === 'warning') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  };

  const getStatusDotColor = (statusStr) => {
    if (statusStr === 'healthy') return 'bg-emerald-500';
    if (statusStr === 'warning') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin text-emerald-500 mb-4" size={32} />
        <p className="text-xs font-semibold tracking-wider uppercase">Đang tải chẩn đoán hệ thống...</p>
      </div>
    );
  }

  const components = [
    { key: 'fastapi', name: 'FastAPI Backend', desc: 'Analytics Core / Vector Inference Proxy' },
    { key: 'spring_boot', name: 'Spring Boot Backend', desc: 'Main Store Client API' },
    { key: 'mysql', name: 'MySQL Database', desc: 'Transactional / Audit Storage' },
    { key: 'redis', name: 'Redis Cache', desc: 'Session Data / Rate Limit Queue' },
    { key: 'qdrant', name: 'Qdrant Vector Database', desc: 'Product ANN Indices' },
    { key: 'rabbitmq', name: 'RabbitMQ Message Broker', desc: 'Product Sync & Async Event Queue' },
  ];

  return (
    <div className="space-y-8 font-sans">
      
      {/* ── Header Toolbar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" size={16} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái chẩn đoán dịch vụ</span>
        </div>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800/40 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-500' : ''} />
          QUÉT LẠI HỆ THỐNG
        </button>
      </div>

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((c) => {
          const s = statuses?.[c.key] || { status: 'down', message: 'Unknown error' };
          const cardColor = getStatusColorClass(s.status);
          const dotColor = getStatusDotColor(s.status);

          return (
            <div 
              key={c.key} 
              className={`bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-colors`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-extrabold text-sm text-slate-200">{c.name}</h4>
                  
                  {/* Status Indicator Pill */}
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${cardColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mb-6">{c.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs">
                {s.status === 'healthy' ? (
                  <>
                    <span className="text-slate-500 font-semibold">Độ trễ phản hồi:</span>
                    <span className="font-bold text-emerald-400">{s.latency_ms}ms</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertOctagon size={12} /> LỖI KẾT NỐI
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold max-w-[150px] truncate" title={s.message}>
                      {s.message}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Security Audit Logs Table ── */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="text-emerald-500" size={16} />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nhật ký hoạt động bảo mật (Audit Logs)</h4>
          </div>
          {logsLoading && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <RefreshCw size={12} className="animate-spin" /> Đang tải trang...
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800/80">
                <th className="pb-3 font-semibold">THỜI GIAN</th>
                <th className="pb-3 font-semibold">SỰ KIỆN</th>
                <th className="pb-3 font-semibold">TÀI KHOẢN</th>
                <th className="pb-3 font-semibold">ĐỊA CHỈ IP</th>
                <th className="pb-3 font-semibold">CHI TIẾT HOẠT ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-600 font-medium">
                    Không tìm thấy bản ghi hoạt động bảo mật.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/10">
                    <td className="py-3 text-slate-400 font-semibold">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider border ${
                        log.event_type.includes('SUCCESS') || log.event_type.includes('CONNECT')
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : log.event_type.includes('FAILED') || log.event_type.includes('LOCKOUT') || log.event_type.includes('SUSPICIOUS')
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-slate-850 border border-slate-800 text-slate-400'
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-200">{log.username}</td>
                    <td className="py-3 font-mono text-slate-400">{log.ip_address}</td>
                    <td className="py-3 text-slate-400 font-medium max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Logs Pagination Toolbar */}
        {auditTotalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
            <span className="text-xs text-slate-500 font-semibold">
              Tổng số: <b className="text-slate-300 font-bold">{auditTotalElements}</b> bản ghi (20 bản ghi/trang)
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(auditPage - 1)}
                disabled={auditPage === 0 || logsLoading}
                className="p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 disabled:opacity-30 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-300 font-bold">
                Trang {auditPage + 1} / {auditTotalPages}
              </span>
              <button
                onClick={() => handlePageChange(auditPage + 1)}
                disabled={auditPage >= auditTotalPages - 1 || logsLoading}
                className="p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 disabled:opacity-30 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SystemHealth;
