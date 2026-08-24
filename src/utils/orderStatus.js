// Trạng thái đơn hàng — khớp với enum Order.Status ở backend
export const ORDER_STEPS = [
  { key: 'pending',   label: 'Đã đặt hàng' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'packing',   label: 'Đang đóng gói' },
  { key: 'shipping',  label: 'Đang giao hàng' },
  { key: 'delivered', label: 'Đã giao hàng' },
];

export const ORDER_STATUS_MAP = {
  pending:   { label: 'Đã đặt hàng',   color: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-400' },
  confirmed: { label: 'Đã xác nhận',   color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  packing:   { label: 'Đang đóng gói', color: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-500' },
  shipping:  { label: 'Đang giao hàng',color: 'bg-slate-800 text-white',       dot: 'bg-slate-900' },
  delivered: { label: 'Đã giao hàng',  color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600' },
  cancelled: { label: 'Đã hủy',        color: 'bg-rose-50 text-rose-700',       dot: 'bg-rose-500' },
  refunded:  { label: 'Đã hoàn tiền',  color: 'bg-purple-50 text-purple-700',   dot: 'bg-purple-500' },
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Đã đặt hàng' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'packing', label: 'Đang đóng gói' },
  { value: 'shipping', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã giao hàng' },
  { value: 'cancelled', label: 'Đã hủy' },
];

// Các trạng thái mà admin có thể chuyển sang
export const ADMIN_NEXT_STATUS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing:   ['shipping', 'cancelled'],
  shipping:  ['delivered'],
  delivered: [],
  cancelled: [],
  refunded:  [],
};
