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

const ORDER_STEPS = [
  { key: 'pending',   label: 'Đã đặt hàng' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'packing',   label: 'Đang đóng gói' },
  { key: 'shipping',  label: 'Đang giao hàng' },
  { key: 'delivered', label: 'Đã giao hàng' },
];

const ORDER_STATUS_MAP = {
  pending:   { label: 'Đã đặt hàng',   color: 'bg-slate-100 text-slate-800', dot: 'bg-slate-400' },
  confirmed: { label: 'Đã xác nhận',   color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  packing:   { label: 'Đang đóng gói', color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  shipping:  { label: 'Đang giao hàng',color: 'bg-slate-100 text-slate-900', dot: 'bg-slate-800' },
  delivered: { label: 'Đã giao hàng',  color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Đã hủy',        color: 'bg-rose-50 text-rose-700',     dot: 'bg-rose-500' },
  refunded:  { label: 'Đã hoàn tiền',  color: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStepIndex = (status) => ORDER_STEPS.findIndex((s) => s.key === status);

const StatusBadge = ({ status }) => {
  const info = ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.pending;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold', info.color)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', info.dot)} />
      {info.label}
    </span>
  );
};

const OrderTimeline = ({ status }) => {
  const isCancelled = status === 'cancelled' || status === 'refunded';
  const currentIdx = isCancelled ? 0 : getStepIndex(status);
  if (isCancelled) return (
    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs">
      <XCircle size={18} className="text-rose-600 flex-shrink-0" />
      <div>
        <p className="font-bold text-rose-800">Đơn hàng đã bị hủy</p>
        <p className="text-rose-600 mt-0.5">Đơn hàng này không còn hiệu lực.</p>
      </div>
    </div>
  );
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 hidden sm:block" style={{ zIndex: 0 }} />
      <div className="absolute top-4 left-4 h-0.5 bg-slate-900 hidden sm:block transition-all duration-500"
        style={{ zIndex: 1, width: currentIdx === 0 ? '0%' : `calc(${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%)` }} />
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 relative z-10">
        {ORDER_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex sm:flex-col items-center gap-2 flex-1">
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                done ? 'bg-slate-900 border-slate-900 text-white' :
                active ? 'bg-white border-slate-900 text-slate-900' :
                'bg-white border-slate-200 text-slate-300')}>
                {done ? <CheckCircle size={14} /> : active ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                ) : <div className="w-2 h-2 rounded-full bg-slate-200" />}
              </div>
              <p className={clsx('text-[11px] text-center leading-tight',
                done ? 'text-slate-900 font-semibold' : active ? 'text-slate-900 font-bold' : 'text-slate-400')}>
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Chi tiết đơn hàng</h3>
            <p className="text-xs text-slate-500 font-medium">#{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Trạng thái đơn hàng</p>
            <OrderTimeline status={order.status} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Sản phẩm</p>
            <div className="space-y-2">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{item.variantName} · SL: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 shrink-0">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            {shipping && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={14} className="text-slate-800" />
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Địa chỉ giao hàng</p>
                </div>
                <p className="text-slate-600 font-medium">
                  {shipping.recipientName} • {shipping.phone}<br />
                  {shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}, {shipping.city}
                </p>
              </div>
            )}
            {payment && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard size={14} className="text-slate-800" />
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Thanh toán</p>
                </div>
                <p className="text-slate-600 font-medium">{payment.method}</p>
              </div>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200/80 text-xs">
            <div className="flex justify-between text-slate-600"><span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span className={order.shippingFee === 0 ? 'text-emerald-600 font-bold' : ''}>{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Tổng cộng</span><span className="text-slate-900 font-extrabold text-sm">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
          {canCancel && (
            !confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)}
                className="w-full py-2.5 border border-rose-300 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors cursor-pointer">
                Hủy đơn hàng này
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <p className="font-bold text-rose-800">Xác nhận hủy đơn hàng?</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmCancel(false)}
                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer">
                    Hủy thao tác
                  </button>
                  <button onClick={handleCancel} disabled={cancelling}
                    className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 cursor-pointer disabled:opacity-50">
                    {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

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
    <div className="min-h-screen bg-[#fafbfd] py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-4"><Breadcrumb items={[{ label: 'Đơn hàng của tôi', to: '/orders' }]} /></div>
        <div className="flex items-center gap-2.5 mb-6">
          <Truck size={20} className="text-slate-900" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            Đơn hàng của tôi
            <span className="ml-2 text-sm font-semibold text-slate-500">({orders.length})</span>
          </h1>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-5">
          {statusFilters.map((f) => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={clsx('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                filterStatus === f.key ? 'bg-slate-900 text-white font-bold' :
                'bg-white text-slate-700 border border-slate-200 hover:border-slate-300')}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-card text-center">
            <Package size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-800 font-bold text-xs">Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-slate-700" />
                    <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="px-4 py-3 flex items-center gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{(order.items || []).map((i) => i.productName).join(', ')}</p>
                    <p className="text-[11px] text-slate-400">{(order.items || []).length} sản phẩm</p>
                  </div>
                  <p className="font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</p>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                  <button onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-900 cursor-pointer">
                    Xem chi tiết <ChevronDown size={13} className="-rotate-90" />
                  </button>
                </div>
              </div>
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
    </div>
  );
};

export default OrderTracking;
