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
    <div className="min-h-screen bg-[#fafbfd] py-6">
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6">
        <div className="mb-4">
          <Breadcrumb
            items={[
              { label: 'Giỏ hàng', to: '/cart' },
              { label: 'Thanh toán', to: '/checkout' },
            ]}
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6 uppercase tracking-tight">Thanh toán đơn hàng</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 sm:p-6">
              <CheckoutForm />
            </div>
          </div>
          <div>
            <CartSummary showCheckoutButton={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
