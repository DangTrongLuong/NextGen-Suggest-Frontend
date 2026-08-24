import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Loading';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';
import { debounce } from '../../utils/helpers';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const pageSize = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        page,
        size: pageSize,
        ...(search && { search }),
      });
      setCustomers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Không tải được danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const debouncedSearch = useCallback(
    debounce((v) => { setPage(0); setSearch(v); }, 400),
    []
  );

  const toggleActive = async (id, current) => {
    setUpdatingId(id);
    try {
      const updated = await adminService.setUserActive(id, !current);
      setCustomers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success(current ? 'Đã vô hiệu tài khoản' : 'Đã kích hoạt tài khoản');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Quản lý Khách hàng</h2>
          <p className="text-xs text-slate-500 font-medium">{totalElements} tài khoản người dùng</p>
        </div>
        <button onClick={fetchCustomers} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer" title="Làm mới">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 font-medium"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="grid gap-3">
          {customers.map((customer) => {
            const avatar = customer.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=0f172a&color=fff`;
            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <img src={avatar} alt={customer.name} className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-900">{customer.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            customer.role === 'admin'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {customer.role}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            customer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {customer.isActive ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 text-sm">{formatPrice(customer.totalSpent)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Tổng chi tiêu</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-3 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Mail size={13} className="text-slate-400" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={13} className="text-slate-400" />
                          {customer.phone}
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-slate-500 font-medium pt-2 border-t border-slate-100">
                      <span>
                        Đăng ký: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </span>
                      <span>• {customer.orderCount} đơn hàng</span>
                      {customer.role !== 'admin' && (
                        <button
                          disabled={updatingId === customer.id}
                          onClick={() => toggleActive(customer.id, customer.isActive)}
                          className={`ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            customer.isActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          } disabled:opacity-50`}
                        >
                          {customer.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {customers.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400 text-xs">Không có khách hàng phù hợp</div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
