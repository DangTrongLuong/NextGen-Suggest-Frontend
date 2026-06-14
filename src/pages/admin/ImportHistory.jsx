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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
            <CheckCircle2 size={12} /> Hoàn tất
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Đang chạy
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
            <Loader2 size={12} /> Chờ duyệt
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
            <XCircle size={12} /> Thất bại
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="text-gray-500" size={22} />
            Lịch sử Import Excel
          </h2>
          <p className="text-sm text-gray-500">{totalElements} tiến trình import</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl p-6 text-center shadow-sm">
          <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4">
            <FileSpreadsheet size={32} />
          </div>
          <p className="font-bold text-gray-800">Không tìm thấy lịch sử import</p>
          <p className="text-xs text-gray-500 mt-1">Các lượt import Excel thông minh của bạn sẽ được hiển thị tại đây</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 bg-gray-50 uppercase border-b border-gray-100 font-black">
                  <tr>
                    <th scope="col" className="px-6 py-4">Tên tệp</th>
                    <th scope="col" className="px-6 py-4">Phân loại</th>
                    <th scope="col" className="px-6 py-4">Trạng thái</th>
                    <th scope="col" className="px-6 py-4 text-center">Đã xử lý</th>
                    <th scope="col" className="px-6 py-4 text-center">Thành công</th>
                    <th scope="col" className="px-6 py-4 text-center">Lỗi</th>
                    <th scope="col" className="px-6 py-4">Thời gian chạy</th>
                    <th scope="col" className="px-6 py-4">Người tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {jobs.map((job) => (
                    <tr key={job.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-bold max-w-[220px] truncate">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet size={16} className="text-emerald-600 flex-shrink-0" />
                          {job.filename}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          job.type === 'PRODUCT' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {job.type === 'PRODUCT' ? 'Sản phẩm' : 'Danh mục'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-800">{job.totalRows}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{job.successRows}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600">{job.failedRows}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          {formatDate(job.startedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                          <User size={13} className="text-gray-400" />
                          {job.createdBy || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p - 1)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ImportHistory;
