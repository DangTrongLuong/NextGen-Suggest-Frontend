import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, CheckCircle, XCircle, ChevronDown,
  MapPin, CreditCard, Truck, X, AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { Spinner } from '../../components/common/Loading';

// ── Status map ────────────────────────────────────────────
const ORDER_STEPS = [
  { key: 'pending',   label: 'Đã đặt hàng' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'packing',   label: 'Đang đóng gói' },
  { key: 'shipping',  label: 'Đang giao hàng' },
  { key: 'delivered', label: 'Đã giao hàng' },
];

const ORDER_STATUS_MAP = {
  pending:   { label: 'Đã đặt hàng',   color: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-400' },
  confirmed: { label: 'Đã xác nhận',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  packing:   { label: 'Đang đóng gói', color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  shipping:  { label: 'Đang giao hàng',color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  delivered: { label: 'Đã giao hàng',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Đã hủy',        color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  refunded:  { label: 'Đã hoàn tiền',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStepIndex = (status) => ORDER_STEPS.findIndex((s) => s.key === status);

const StatusBadge = ({ status }) => {
  const info = ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.pending;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', info.color)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', info.dot)} />
      {info.label}
    </span>
  );
};

const OrderTimeline = ({ status }) => {
  const isCancelled = status === 'cancelled' || status === 'refunded';
  const currentIdx = isCancelled ? 0 : getStepIndex(status);
  if (isCancelled) return (
    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
      <XCircle size={22} className="text-red-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-bold text-red-700">Đơn hàng đã bị hủy</p>
        <p className="text-xs text-red-500 mt-0.5">Đơn hàng này đã được hủy và không thể khôi phục.</p>
      </div>
    </div>
  );
  return (
    <div className="relative">
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 hidden sm:block" style={{ zIndex: 0 }} />
      <div className="absolute top-5 left-5 h-0.5 bg-emerald-500 hidden sm:block transition-all duration-700"
        style={{ zIndex: 1, width: currentIdx === 0 ? '0%' : `calc(${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%)` }} />
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0 relative z-10">
        {ORDER_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 flex-1">
              <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300',
                done ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-white border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-200' :
                'bg-white border-gray-200 text-gray-300')}>
                {done ? <CheckCircle size={18} /> : active ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-3 h-3 rounded-full bg-emerald-500" />
                ) : <div className="w-3 h-3 rounded-full bg-gray-200" />}
              </div>
              <p className={clsx('text-xs font-medium text-center leading-tight',
                done ? 'text-emerald-600' : active ? 'text-emerald-700 font-bold' : 'text-gray-400')}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, onCancelSuccess }) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.cancel(order.id);
      onCancelSuccess(order.id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const shipping = order.shippingAddress;
  const payment = order.payment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h3>
            <p className="text-sm text-gray-500">#{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-4">Trạng thái đơn hàng</p>
            <OrderTimeline status={order.status} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">Sản phẩm đã đặt</p>
            <div className="space-y-3">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-14 h-14 rounded-xl object-cover bg-gray-200 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.variantName} · SL: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {shipping && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={15} className="text-emerald-600" />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Địa chỉ giao hàng</p>
                </div>
                <p className="text-sm text-gray-600">
                  {shipping.recipientName} · {shipping.phone}<br />
                  {shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}, {shipping.city}
                </p>
              </div>
            )}
            {payment && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={15} className="text-emerald-600" />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Thanh toán</p>
                </div>
                <p className="text-sm text-gray-600">{payment.method}</p>
                <StatusBadge status={payment.status === 'completed' ? 'delivered' : 'pending'} />
              </div>
            )}
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Phí vận chuyển</span>
              <span className={order.shippingFee === 0 ? 'text-emerald-600 font-medium' : ''}>{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Tổng cộng</span><span className="text-lg">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
          {canCancel && (
            !confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)}
                className="w-full py-3 border-2 border-red-200 text-red-500 text-sm font-semibold rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all">
                Hủy đơn hàng
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Xác nhận hủy đơn hàng?</p>
                    <p className="text-xs text-red-500 mt-1">Hành động này không thể hoàn tác.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmCancel(false)}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    Giữ đơn hàng
                  </button>
                  <button onClick={handleCancel} disabled={cancelling}
                    className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60">
                    {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                  </button>
                </div>
              </motion.div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const OrderTracking = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  if (!isAuthenticated) return <Navigate to="/" replace />;

  useEffect(() => {
    orderService.getMyOrders(0, 50)
      .then((data) => setOrders(data?.content || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelSuccess = (orderId) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  };

  const displayOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const statusFilters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'packing', label: 'Đóng gói' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6"><Breadcrumb items={[{ label: 'Theo dõi đơn hàng', to: '/orders' }]} /></div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Truck size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Theo dõi đơn hàng</h1>
          <p className="text-sm text-gray-500">{orders.length} đơn hàng của bạn</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        {statusFilters.map((f) => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={clsx('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
              filterStatus === f.key ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' :
              'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600')}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : displayOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">Không có đơn hàng</p>
          <p className="text-gray-500 text-sm">Chưa có đơn hàng nào phù hợp với bộ lọc này.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Package size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <p className="text-sm font-bold text-gray-900 hidden sm:block">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {(order.items || []).slice(0, 3).map((item) => (
                    item.imageUrl && <img key={item.id} src={item.imageUrl} alt={item.productName}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-white bg-gray-100" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">{(order.items || []).map((i) => i.productName).join(', ')}</p>
                  <p className="text-xs text-gray-400">{(order.items || []).length} sản phẩm</p>
                </div>
                <p className="text-sm font-bold text-gray-900 sm:hidden">{formatPrice(order.totalAmount)}</p>
              </div>
              {order.status !== 'cancelled' && order.status !== 'refunded' && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-1">
                    {ORDER_STEPS.map((step, idx) => {
                      const stepIdx = getStepIndex(order.status);
                      const done = idx <= stepIdx;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className={clsx('w-2 h-2 rounded-full flex-shrink-0 transition-colors', done ? 'bg-emerald-500' : 'bg-gray-200')} />
                          {idx < ORDER_STEPS.length - 1 && <div className={clsx('flex-1 h-0.5 transition-colors', idx < stepIdx ? 'bg-emerald-500' : 'bg-gray-200')} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-gray-400">Đặt hàng</p>
                    <p className="text-[10px] text-gray-400">Đã giao</p>
                  </div>
                </div>
              )}
              <div className="px-5 py-3 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs text-gray-400">{order.payment?.method || ''}</p>
                <button onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Xem chi tiết <ChevronDown size={14} className="-rotate-90" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onCancelSuccess={handleCancelSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderTracking;
