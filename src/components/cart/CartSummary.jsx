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
    { icon: Truck, text: cartTotal >= 1000000 ? 'Đã áp dụng miễn phí vận chuyển!' : 'Miễn phí vận chuyển đơn từ 1.000.000 ₫' },
    { icon: ShieldCheck, text: 'Thanh toán an toàn & bảo mật' },
    { icon: RotateCcw, text: 'Đổi trả miễn phí trong 30 ngày' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Tóm tắt đơn hàng</h3>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tạm tính ({items.length} sản phẩm)</span>
            <span className="font-medium text-gray-900">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Phí vận chuyển</span>
            <span className={shipping === 0 ? 'text-emerald-600 font-medium' : 'font-medium text-gray-900'}>
              {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Thuế (8%)</span>
            <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">Tổng cộng</span>
            <span className="font-bold text-xl text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>

        {showCheckoutButton && (
          <Link to="/checkout">
            <Button fullWidth size="lg">
              Tiến hành thanh toán
            </Button>
          </Link>
        )}
      </div>

      {/* Perks */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 space-y-2.5">
        {perks.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-xs text-gray-600">
            <Icon size={14} className="text-emerald-600 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartSummary;
