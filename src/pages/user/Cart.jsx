import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import EmptyState from '../../components/common/EmptyState';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { items, clearCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Giỏ hàng', to: '/cart' }]} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          Giỏ hàng
          {items.length > 0 && (
            <span className="ml-3 text-lg font-normal text-gray-500">({items.length} sản phẩm)</span>
          )}
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Giỏ hàng trống"
          description="Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy bắt đầu mua sắm ngay!"
          action={() => {}}
          actionLabel="Khám phá sản phẩm"
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <CartItem key={`${item.id}-${item.color}`} item={item} />
              ))}
            </AnimatePresence>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-4"
            >
              <ArrowLeft size={16} />
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Summary */}
          <div>
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
