import { useEffect, useState, useCallback } from 'react';
import { History, FileSpreadsheet, User, Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Pagination from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Loading';

const ImportHistory = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const fetchHistory = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await adminService.getImportHistory(p, pageSize);
      setJobs(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Không tải được lịch sử import');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">
            <CheckCircle2 size={11} /> Hoàn tất
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">
            <Loader2 size={11} className="animate-spin" /> Đang xử lý
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase">
            <Loader2 size={11} /> Chờ duyệt
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded uppercase">
            <XCircle size={11} /> Thất bại
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <History className="text-slate-700" size={20} />
            Lịch sử Import Excel
          </h2>
          <p className="text-xs text-slate-500 font-medium">{totalElements} tiến trình import</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-card">
          <FileSpreadsheet size={36} className="text-slate-300 mb-2" />
          <p className="font-bold text-slate-800 text-xs">Chưa có lịch sử import</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-slate-700 bg-slate-50 uppercase border-b border-slate-100 font-bold">
                  <tr>
                    <th scope="col" className="px-4 py-3">Tên tệp</th>
                    <th scope="col" className="px-4 py-3">Loại</th>
                    <th scope="col" className="px-4 py-3">Trạng thái</th>
                    <th scope="col" className="px-4 py-3 text-center">Đã xử lý</th>
                    <th scope="col" className="px-4 py-3 text-center">Thành công</th>
                    <th scope="col" className="px-4 py-3 text-center">Lỗi</th>
                    <th scope="col" className="px-4 py-3">Thời gian</th>
                    <th scope="col" className="px-4 py-3">Người tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-900 truncate max-w-[200px]">
                        <span className="flex items-center gap-1.5">
                          <FileSpreadsheet size={14} className="text-slate-700 shrink-0" />
                          {job.filename}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.type === 'PRODUCT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {job.type === 'PRODUCT' ? 'Sản phẩm' : 'Danh mục'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-slate-800">{job.totalRows}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{job.successRows}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-rose-600">{job.failedRows}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500 font-medium">
                        {formatDate(job.startedAt)}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-700 font-semibold">
                        {job.createdBy || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                currentPage={page + 1}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImportHistory;
