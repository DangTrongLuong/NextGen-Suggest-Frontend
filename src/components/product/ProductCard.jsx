import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { searchAnalyticsService } from '../../services/searchAnalyticsService';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);

  const price = product.price ?? product.basePrice ?? 0;
  const originalPrice = product.originalPrice ?? product.comparePrice ?? 0;
  const rating = product.rating ?? product.ratingAvg ?? 0;
  const reviewCount = product.reviewCount ?? product.ratingCount ?? 0;
  const stock = Number(product.stock ?? 0);
  const hasStock = stock > 0;
  const categoryName = product.categoryName ?? product.category?.name ?? 'Sản phẩm';

  const discount =
    product.discount != null
      ? product.discount
      : originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

  const primaryImage =
    product.imageUrl ??
    product.images?.find((img) => img.isPrimary === true)?.url ??
    product.images?.[0]?.url ??
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80';

  const handleProductClick = () => {
    try {
      searchAnalyticsService.trackClick({
        productId: product.id || product.uuid || '',
        productName: product.name || product.title || '',
        requestId: product.requestId || null,
      });

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group bg-white rounded-xl overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-card hover:shadow-dropdown transition-all duration-200 flex flex-col justify-between h-full"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-slate-50 aspect-square flex-shrink-0">
        <Link to={`/products/${product.id}`} state={{ searchUrl: window.location.pathname + window.location.search }} onClick={handleProductClick} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isNew && (
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-semibold tracking-wider rounded">
              MỚI
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          onClick={() => toggleWishlist(product)}
          className={clsx(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs border border-slate-200/80 transition-all duration-150 z-10 opacity-0 group-hover:opacity-100 cursor-pointer',
            inWishlist && 'opacity-100 text-rose-500 bg-white'
          )}
          title="Thêm vào yêu thích"
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} className="transition-transform active:scale-75" />
        </button>

        {!hasStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
            <span className="px-2.5 py-1 bg-slate-700 text-white text-[10px] font-semibold rounded">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1 uppercase truncate">
            {categoryName}
          </p>

          {product.recommendationReason && (
            <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold truncate max-w-full">
              <Sparkles size={10} className="text-emerald-500 shrink-0" />
              <span className="truncate">{product.recommendationReason}</span>
            </div>
          )}

          <Link to={`/products/${product.id}`} state={{ searchUrl: window.location.pathname + window.location.search }} onClick={handleProductClick}>
            <h3 className="text-xs font-semibold text-slate-900 hover:text-emerald-600 line-clamp-2 leading-snug mb-1.5 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2.5">
            <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-800">
              {Number(rating).toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ({reviewCount})
            </span>
          </div>

          {/* Price & Action Row */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
            <div className="flex flex-col min-w-0 flex-1 pr-1">
              <span className="text-xs font-bold text-slate-900 truncate tracking-tight">
                {formatPrice(price)}
              </span>
              {originalPrice > price && (
                <span className="text-[10px] text-slate-400 line-through truncate font-normal">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

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
                'w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 border cursor-pointer',
                inCart
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-900 hover:border-slate-900 hover:text-white',
                !hasStock && 'opacity-30 cursor-not-allowed border-slate-100 text-slate-300 bg-slate-50'
              )}
              title="Thêm vào giỏ"
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