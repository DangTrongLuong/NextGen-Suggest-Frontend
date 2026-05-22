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

  // Client-side search filtering (within current page)
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
      // Refresh list and modal
      fetchOrders();
      setSelectedOrder(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Đơn hàng</h2>
          <p className="text-sm text-gray-500">{totalElements} đơn hàng</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
          title="Làm mới"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, tên hoặc email khách hàng..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Mã đơn', 'Khách hàng', 'Số sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày', 'Thao tác'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{order.customerName || '—'}</p>
                        <p className="text-xs text-gray-500">{order.customerEmail || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || 0} sản phẩm</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">Không có đơn hàng phù hợp</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Đơn hàng ${selectedOrder.orderNumber}` : ''}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                <p className="text-sm font-semibold text-gray-900">{selectedOrder.customerName || '—'}</p>
                <p className="text-xs text-gray-500">{selectedOrder.customerEmail || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_MAP[selectedOrder.status]?.color || ''}`}>
                  {ORDER_STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Thanh toán</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrder.payment?.method || '—'}</p>
                <p className="text-xs text-gray-500 capitalize">{selectedOrder.payment?.status || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Địa chỉ giao hàng</p>
                <p className="text-sm text-gray-900">
                  {selectedOrder.shippingAddress.recipientName} · {selectedOrder.shippingAddress.phone}
                </p>
                <p className="text-sm text-gray-700">
                  {[
                    selectedOrder.shippingAddress.addressLine1,
                    selectedOrder.shippingAddress.addressLine2,
                    selectedOrder.shippingAddress.city,
                    selectedOrder.shippingAddress.state,
                    selectedOrder.shippingAddress.postalCode,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-3">Sản phẩm</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.variantName} · SL: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(selectedOrder.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thuế</span>
                <span>{formatPrice(selectedOrder.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Tổng cộng</span>
                <span>{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Status update actions */}
            {ADMIN_NEXT_STATUS[selectedOrder.status]?.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Cập nhật trạng thái</p>
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
