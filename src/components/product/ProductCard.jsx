import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);

  // ✅ Normalize fields — support both API format and mapped format
  const price = product.price ?? product.basePrice ?? 0;
  const originalPrice = product.originalPrice ?? product.comparePrice ?? 0;
  const rating = product.rating ?? product.ratingAvg ?? 0;
  const reviewCount = product.reviewCount ?? product.ratingCount ?? 0;
  const stock = Number(product.stock ?? 0);
  const hasStock = stock > 0;
  const categoryName = product.categoryName ?? product.category?.name ?? 'Sản phẩm';

  // ✅ Calculate discount if not present
  const discount =
    product.discount != null
      ? product.discount
      : originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

  // ✅ Read imageUrl directly (needed for FastAPI mapped products), fallback to images array
  const primaryImage =
    product.imageUrl ??
    product.images?.find((img) => img.isPrimary === true)?.url ??
    product.images?.[0]?.url ??
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80';

  const handleProductClick = () => {
    try {
      const sessionId = localStorage.getItem('nivora_session_id');
      const payload = {
        product_id: String(product.id || product.uuid || ''),
        product_name: product.name || product.title || '',
        request_id: product.requestId || null,
        session_id: sessionId || null,
      };
      fetch('/analytics/search/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});

      if (window.location.search.includes('search=')) {
        sessionStorage.setItem('nivora_search_back_url', window.location.pathname + window.location.search);
        const searchParams = new URLSearchParams(window.location.search);
        sessionStorage.setItem('nivora_search_back_query', searchParams.get('search') || '');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-xl overflow-hidden border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full"
    >
      {/* Product Image Section */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square flex-shrink-0">
        <Link to={`/products/${product.id}`} state={{ searchUrl: window.location.pathname + window.location.search }} onClick={handleProductClick} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.isNew && (
            <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold tracking-wider rounded-sm">
              NEW
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-accent text-white text-[10px] font-bold rounded-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist Button - Top Right Overlay */}
        <button
          onClick={() => toggleWishlist(product)}
          className={clsx(
            'absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 hover:bg-white text-gray-650 hover:text-red-500 shadow-sm border border-gray-100 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100',
            inWishlist && 'opacity-100 text-red-500 bg-white'
          )}
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} className="transition-transform duration-200 active:scale-75" />
        </button>

        {/* Out of stock overlay */}
        {!hasStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="px-2.5 py-1 bg-gray-400 text-white text-[11px] font-medium tracking-wide rounded-sm">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <p className="text-[10px] text-gray-400 font-medium tracking-wide mb-1 uppercase">
            {categoryName}
          </p>

          {/* Recommendation Reason */}
          {product.recommendationReason && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold leading-normal w-fit">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {product.recommendationReason}
            </div>
          )}
          
          {/* Title */}
          <Link to={`/products/${product.id}`} state={{ searchUrl: window.location.pathname + window.location.search }} onClick={handleProductClick}>
            <h3 className="text-xs sm:text-sm font-normal text-gray-900 hover:text-black line-clamp-2 leading-snug mb-2 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Rating - Compact Tiki/Amazon style (single star + value) */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center text-amber-500">
              <Star size={12} className="fill-current" />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {Number(rating).toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({reviewCount})
            </span>
            {product.views !== undefined && product.views !== null && (
              <>
                <span className="text-gray-300 text-[10px]">|</span>
                <span className="text-[10px] text-gray-550 font-light flex items-center gap-0.5">
                  👁️ {product.views} lượt xem
                </span>
              </>
            )}
          </div>

          {/* Price & Action Row */}
          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 truncate">
              <span className="text-sm sm:text-base font-bold text-accent">
                {formatPrice(price)}
              </span>
              {originalPrice > price && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={() => {
                const isLoggedIn = !!localStorage.getItem('auth_tokens');
                if (!isLoggedIn) {
                  toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
                  window.dispatchEvent(new Event('open-login-modal'));
                  return;
                }
                addToCart(product);
              }}
              disabled={!hasStock}
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 border cursor-pointer',
                inCart
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50/80 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white',
                !hasStock && 'opacity-30 cursor-not-allowed border-gray-100 text-gray-300 bg-gray-50'
              )}
            >
              <ShoppingCart size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;