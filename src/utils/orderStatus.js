// Trạng thái đơn hàng — khớp với enum Order.Status ở backend
export const ORDER_STEPS = [
  { key: 'pending',   label: 'Đã đặt hàng' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'packing',   label: 'Đang đóng gói' },
  { key: 'shipping',  label: 'Đang giao hàng' },
  { key: 'delivered', label: 'Đã giao hàng' },
];

export const ORDER_STATUS_MAP = {
  pending:   { label: 'Đã đặt hàng',   color: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-400' },
  confirmed: { label: 'Đã xác nhận',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  packing:   { label: 'Đang đóng gói', color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  shipping:  { label: 'Đang giao hàng',color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  delivered: { label: 'Đã giao hàng',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Đã hủy',        color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  refunded:  { label: 'Đã hoàn tiền',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
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
