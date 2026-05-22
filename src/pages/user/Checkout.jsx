import { Navigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import CheckoutForm from '../../components/cart/CheckoutForm';
import CartSummary from '../../components/cart/CartSummary';
import { useCart } from '../../context/CartContext';

const Checkout = () => {
  const { items } = useCart();
  const location = useLocation();
  const isBuyNow = location.state?.buyNow;

  if (items.length === 0 && !isBuyNow) return <Navigate to="/cart" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Cart', to: '/cart' },
            { label: 'Checkout', to: '/checkout' },
          ]}
        />
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <CheckoutForm />
          </div>
        </div>
        <div>
          <CartSummary showCheckoutButton={false} />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
