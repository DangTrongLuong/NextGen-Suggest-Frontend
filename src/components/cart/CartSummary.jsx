import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../common/Button';

const CartSummary = ({ showCheckoutButton = true }) => {
  const { items, cartTotal } = useCart();

  const shipping = cartTotal >= 1000000 ? 0 : 30000;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  const perks = [
    { icon: Truck, text: cartTotal >= 1000000 ? 'Miễn phí vận chuyển đơn hàng!' : 'Freeship cho đơn từ 1.000.000 ₫' },
    { icon: ShieldCheck, text: 'Bảo mật thông tin 100%' },
    { icon: RotateCcw, text: 'Đổi trả dễ dàng trong 30 ngày' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="p-5">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">Tóm tắt đơn hàng</h3>

        <div className="space-y-2.5 mb-5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Tạm tính ({items.length} SP)</span>
            <span className="font-semibold text-slate-900">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Phí vận chuyển</span>
            <span className={shipping === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-slate-900'}>
              {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Thuế VAT (8%)</span>
            <span className="font-semibold text-slate-900">{formatPrice(tax)}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
            <span className="font-bold text-slate-900 uppercase text-xs">Tổng tiền</span>
            <span className="font-extrabold text-lg text-slate-900">{formatPrice(total)}</span>
          </div>
        </div>

        {showCheckoutButton && (
          <Link to="/checkout">
            <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs">
              Tiến hành thanh toán
            </button>
          </Link>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50 space-y-2">
        {perks.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Icon size={14} className="text-slate-800 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartSummary;
