import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../../components/product/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { useWishlist } from '../../context/WishlistContext';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-[#fafbfd] py-6">
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto px-4 sm:px-6">
        <div className="mb-4">
          <Breadcrumb items={[{ label: 'Danh sách yêu thích', to: '/wishlist' }]} />
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <Heart size={20} className="text-rose-600 fill-rose-600" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            Sản phẩm yêu thích
            {wishlist.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-500">({wishlist.length} sản phẩm)</span>
            )}
          </h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-card">
            <EmptyState
              icon={Heart}
              title="Danh sách yêu thích trống"
              description="Lưu lại những món đồ bạn yêu thích để dễ dàng tham khảo và mua sắm bất cứ lúc nào."
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
          >
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
