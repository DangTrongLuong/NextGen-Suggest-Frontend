import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Loading';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';
import { ORDER_STATUS_MAP, ORDER_STATUS_OPTIONS, ADMIN_NEXT_STATUS } from '../../utils/orderStatus';
import { debounce } from '../../utils/helpers';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const pageSize = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders({
        page,
        size: pageSize,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      setOrders(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerEmail || '').toLowerCase().includes(q)
    );
  });

  const debouncedSearch = useCallback(
    debounce((v) => setSearch(v), 300),
    []
  );

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await adminService.updateOrderStatus(orderId, newStatus.toUpperCase());
      toast.success('Đã cập nhật trạng thái đơn hàng');
      fetchOrders();
      setSelectedOrder(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Quản lý Đơn hàng</h2>
          <p className="text-xs text-slate-500 font-medium">{totalElements} đơn hàng tổng cộng</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Làm mới"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, tên hoặc email..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 font-medium"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-slate-900 cursor-pointer"
        >
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày', 'Thao tác'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-bold text-slate-900">#{order.orderNumber}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-900">{order.customerName || '—'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{order.customerEmail || '—'}</p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-medium">{order.items?.length || 0} SP</td>
                      <td className="px-4 py-2.5 font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">Không có đơn hàng phù hợp</div>
          )}
        </div>
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

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Đơn hàng #${selectedOrder.orderNumber}` : ''}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.customerName || '—'}</p>
                <p className="text-[11px] text-slate-500">{selectedOrder.customerEmail || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 uppercase ${ORDER_STATUS_MAP[selectedOrder.status]?.color || ''}`}>
                  {ORDER_STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Thanh toán</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.payment?.method || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Ngày đặt</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Địa chỉ giao hàng</p>
                <p className="font-bold text-slate-900">
                  {selectedOrder.shippingAddress.recipientName} • {selectedOrder.shippingAddress.phone}
                </p>
                <p className="text-slate-600 font-medium mt-0.5">
                  {[
                    selectedOrder.shippingAddress.addressLine1,
                    selectedOrder.shippingAddress.addressLine2,
                    selectedOrder.shippingAddress.city,
                    selectedOrder.shippingAddress.state,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Sản phẩm</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex gap-2.5 items-center p-2.5 bg-white border border-slate-200/80 rounded-xl">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">{item.variantName} • SL: {item.quantity}</p>
                    </div>
                    <p className="font-extrabold text-slate-900">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(selectedOrder.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Tổng cộng</span>
                <span className="font-extrabold text-sm">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {ADMIN_NEXT_STATUS[selectedOrder.status]?.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cập nhật trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {ADMIN_NEXT_STATUS[selectedOrder.status].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === 'cancelled' ? 'danger' : 'primary'}
                      loading={updatingStatus}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                    >
                      → {ORDER_STATUS_MAP[s]?.label || s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;
