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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Khách hàng</h2>
          <p className="text-sm text-gray-500">{totalElements} tài khoản</p>
        </div>
        <button onClick={fetchCustomers} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100" title="Làm mới">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => {
            const avatar = customer.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=10b981&color=fff`;
            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start gap-4">
                  <img src={avatar} alt={customer.name} className="w-12 h-12 rounded-full bg-gray-100 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{customer.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            customer.role === 'admin'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {customer.role}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            customer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {customer.isActive ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">{formatPrice(customer.totalSpent)}</p>
                        <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-gray-400" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />
                          {customer.phone}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>
                        Đăng ký: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </span>
                      <span>{customer.orderCount} đơn hàng</span>
                      {customer.role !== 'admin' && (
                        <button
                          disabled={updatingId === customer.id}
                          onClick={() => toggleActive(customer.id, customer.isActive)}
                          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            customer.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          } disabled:opacity-50`}
                        >
                          {customer.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {customers.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">Không có khách hàng phù hợp</div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}
    </div>
  );
};

export default CustomerManagement;
