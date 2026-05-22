import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../common/Button';

const CartSummary = ({ showCheckoutButton = true }) => {
  const { items, cartTotal } = useCart();

  const shipping = cartTotal >= 100 ? 0 : 9.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  const perks = [
    { icon: Truck, text: cartTotal >= 100 ? 'Free shipping applied!' : `Free shipping on orders $100+` },
    { icon: ShieldCheck, text: 'Secure checkout' },
    { icon: RotateCcw, text: '30-day free returns' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h3>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({items.length} items)</span>
            <span className="font-medium text-gray-900">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className={shipping === 0 ? 'text-emerald-600 font-medium' : 'font-medium text-gray-900'}>
              {shipping === 0 ? 'FREE' : formatPrice(shipping)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (8%)</span>
            <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>

        {showCheckoutButton && (
          <Link to="/checkout">
            <Button fullWidth size="lg">
              Proceed to Checkout
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
