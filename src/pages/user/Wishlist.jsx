import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../../components/product/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { useWishlist } from '../../context/WishlistContext';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Wishlist', to: '/wishlist' }]} />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <h1 className="text-2xl font-black text-gray-900">
          My Wishlist
          {wishlist.length > 0 && (
            <span className="ml-3 text-lg font-normal text-gray-500">({wishlist.length} items)</span>
          )}
        </h1>
      </div>

      {wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love to your wishlist and come back to them anytime."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Wishlist;
