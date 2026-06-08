import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/formatPrice';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);

  // ✅ Normalize fields — support cả API format lẫn mapped format
  const price = product.price ?? product.basePrice ?? 0;
  const originalPrice = product.originalPrice ?? product.comparePrice ?? 0;
  const rating = product.rating ?? product.ratingAvg ?? 0;
  const reviewCount = product.reviewCount ?? product.ratingCount ?? 0;
  const stock = Number(product.stock ?? 0);
  const hasStock = stock > 0;
  const categoryName = product.categoryName ?? product.category?.name ?? '';

  // ✅ Tính discount nếu không có sẵn
  const discount =
    product.discount != null
      ? product.discount
      : originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

  // ✅ Lấy ảnh đúng field
  const primaryImage =
  product.images?.find((img) => img.isPrimary == true)?.url ??
  product.images?.[0]?.url ??
  'https://via.placeholder.com/600x600?text=No+Image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <Link to={`/products/${product.id}`}>
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
              NEW
            </span>
          )}
          {discount > 0 && (
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
              -{discount}%
            </span>
          )}
        </div>

      {/* Actions overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleWishlist(product)}
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-colors',
            inWishlist
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
          )}
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
        </motion.button>
        <Link
          to={`/products/${product.id}`}
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
        >
          <Eye size={14} />
        </Link>
      </div>

      {/* Out of stock overlay */}
      {!hasStock && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg">
            Out of Stock
          </span>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="p-3">
      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">
        {categoryName}
      </p>
      <Link to={`/products/${product.id}`}>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 hover:text-emerald-600 transition-colors mb-1.5">
          {product.name}
        </h3>
      </Link>

      {/* Rating */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={10}
              className={
                i < Math.floor(rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-200'
              }
            />
          ))}
        </div>
        <span className="text-[10px] text-gray-500">
          ({reviewCount.toLocaleString()})
        </span>
      </div>

      {/* Price + Cart */}
      <div className="flex items-center justify-between gap-1">
        <div className="truncate">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {originalPrice > price && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through ml-1.5">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => addToCart(product)}
          disabled={!hasStock}
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
            inCart
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-emerald-600 hover:text-white',
            !hasStock && 'opacity-40 cursor-not-allowed'
          )}
        >
          <ShoppingCart size={14} />
        </motion.button>
      </div>
    </div>
  </motion.div>
  );
};

export default ProductCard;