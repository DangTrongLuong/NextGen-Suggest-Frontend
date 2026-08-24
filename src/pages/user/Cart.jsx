import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import EmptyState from '../../components/common/EmptyState';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { items, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-[#fafbfd] py-6">
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6">
        <div className="mb-4">
          <Breadcrumb items={[{ label: 'Giỏ hàng', to: '/cart' }]} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            Giỏ hàng
            {items.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-500">({items.length} sản phẩm)</span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-card">
            <EmptyState
              icon={ShoppingBag}
              title="Giỏ hàng trống"
              description="Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các bộ sưu tập ngay!"
              action={() => {}}
              actionLabel="Khám phá ngay"
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <CartItem key={`${item.id}-${item.color}`} item={item} />
                ))}
              </AnimatePresence>

              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors mt-3"
              >
                <ArrowLeft size={14} />
                Tiếp tục mua sắm
              </Link>
            </div>

            <div>
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
