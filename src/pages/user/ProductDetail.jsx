import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Check, Minus, Plus, Share2, Zap } from 'lucide-react';
import ProductGallery from '../../components/product/ProductGallery';
import ProductReview from '../../components/product/ProductReview';
import ProductCard from '../../components/product/ProductCard';
import { normalizeProducts } from '../../utils/productNormalizer';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/Loading';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatPrice';
import clsx from 'clsx';

// Normalize API product → component shape
const normalize = (p) => ({
  ...p,
  price: p.basePrice,
  originalPrice: p.comparePrice,
  discount: p.comparePrice > p.basePrice
    ? Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100) : 0,
  rating: parseFloat(p.ratingAvg) || 0,
  reviewCount: p.ratingCount || 0,
  images: (p.images || []).map((img) => ({ ...img, url: img.url })),
  stock: p.variants?.[0]?.availableStock ?? 0,
  colors: p.variants?.map((v) => v.name) || [],
  features: [],
});

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);

  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    productService.getById(id)
      .then((data) => {
        const norm = normalize(data);
        setProduct(norm);
        setSelectedVariant(data.variants?.[0] || null);
        return productService.getRelated(id, 4);
      })
      .then((rel) => setRelated(normalizeProducts(rel || [])))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  // All hooks must be called before any conditional return (Rules of Hooks)
  const inWishlist = isInWishlist(product?.id);
  const inCart = isInCart(product?.id);
  const currentStock = selectedVariant?.availableStock ?? product?.stock ?? 0;
  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentComparePrice = selectedVariant?.comparePrice ?? product?.originalPrice ?? 0;
  const allVariants = product?.variants || [];
  const displayedImages = (() => {
    if (!product) return [{ url: 'https://via.placeholder.com/600x600?text=No+Image', raw: '' }];
    const variantImgs = selectedVariant?.imageUrl
      ? [{ url: `${selectedVariant.imageUrl}?v=${product.updatedAt || product.id}`, raw: selectedVariant.imageUrl }]
      : [];
    const baseImgs = (product.images || []).map((img) => ({
      ...img,
      raw: img.url,
      url: `${img.url}?v=${product.updatedAt || product.id}`,
    }));
    return [...variantImgs, ...baseImgs].length > 0
      ? [...variantImgs, ...baseImgs]
      : [{ url: 'https://via.placeholder.com/600x600?text=No+Image', raw: '' }];
  })();

  if (loading) return <PageLoader />;
  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-semibold text-gray-900">Không tìm thấy sản phẩm</p>
      <Link to="/products"><Button>Quay lại sản phẩm</Button></Link>
    </div>
  );

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant?.id);
  };

  const handleSelectVariant = (variant) => {
    setSelectedVariant(variant || null);
    setQuantity(1);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant?.id);
    navigate('/checkout', { state: { buyNow: true, productId: product.id, variantId: selectedVariant?.id } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: 'Sản phẩm', to: '/products' },
          { label: product.name, to: `/products/${product.id}` },
        ]} />
      </div>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ProductGallery
            images={displayedImages.map((img) => img.url || img)}
            name={product.name}
            activeImage={selectedVariant?.imageUrl ? `${selectedVariant.imageUrl}?v=${product.updatedAt || product.id}` : undefined}
            onImageClick={(image) => {
              const raw = image?.split('?v=')?.[0] || image;
              const matched = allVariants.find((v) => v.imageUrl === raw);
              if (matched) handleSelectVariant(matched);
            }}
          />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.isNew && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">MỚI</span>}
            {product.isBestSeller && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">BÁN CHẠY</span>}
            {product.discount > 0 && <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">-{product.discount}% OFF</span>}
          </div>

          <div>
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">{product.brand}</p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.reviewCount.toLocaleString()} đánh giá)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-gray-900">{formatPrice(currentPrice)}</span>
            {currentComparePrice > currentPrice && (
              <span className="text-xl text-gray-400 line-through">{formatPrice(currentComparePrice)}</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed">{product.description || product.shortDescription}</p>

          {/* Variants */}
          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2.5">
                Phiên bản: <span className="font-normal text-gray-600">{selectedVariant?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, idx) => {
                  const variant = product.variants?.[idx];
                  return (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => handleSelectVariant(variant || null)}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                        selectedVariant?.id === variant?.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2.5">Số lượng</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {currentStock > 0 ? `${currentStock} còn hàng` : 'Hết hàng'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" fullWidth onClick={handleAddToCart} disabled={currentStock === 0} className="flex-1">
              <ShoppingCart size={18} />
              {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
            </Button>
            <Button size="lg" fullWidth onClick={handleBuyNow} disabled={currentStock === 0} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Zap size={18} />
              Thanh toán ngay
            </Button>
            <button onClick={() => toggleWishlist(product)}
              className={clsx('w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all',
                inWishlist ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-400')}>
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
            <button className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-all">
              <Share2 size={18} />
            </button>
          </div>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Tính năng nổi bật</p>
              <ul className="space-y-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Check size={15} className="text-emerald-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex gap-1 border-b border-gray-200 mb-8">
          {['description', 'reviews'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={clsx('px-6 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px',
                activeTab === tab ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {tab === 'description' ? 'Mô tả' : 'Đánh giá'}
            </button>
          ))}
        </div>
        {activeTab === 'description' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-gray-600 leading-relaxed text-base">{product.description || 'Chưa có mô tả.'}</p>
          </motion.div>
        )}
        {activeTab === 'reviews' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ProductReview product={product} />
          </motion.div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-8">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Recently viewed */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Bạn có thể thích</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.slice(0, 4).map((p) => <ProductCard key={`rec-${p.id}`} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;