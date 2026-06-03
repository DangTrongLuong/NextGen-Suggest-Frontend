import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Star, Check, Minus, Plus, Share2, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
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

// ─── Normalize API → component ──────────────────────────────────────────────
const normalize = (p) => ({
  ...p,
  price: p.basePrice,
  originalPrice: p.comparePrice,
  discount:
    p.comparePrice > p.basePrice
      ? Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100)
      : 0,
  rating: parseFloat(p.ratingAvg) || 0,
  reviewCount: p.ratingCount || 0,
});

// ─── Tất cả ảnh của sản phẩm (ảnh gốc + ảnh từng variant) ─────────────────
const buildAllImages = (product) => {
  if (!product) return [];
  const seen = new Set();
  const imgs = [];

  const push = (url, variantId = null) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    imgs.push({ url, variantId });
  };

  // 1. Ảnh chính của product
  if (product.imageUrl) push(product.imageUrl, null);

  // 2. Ảnh từ bảng product_images
  (product.images || []).forEach((img) => push(img.url, null));

  // 3. Ảnh riêng từng variant
  (product.variants || []).forEach((v) => {
    if (v.imageUrl) push(v.imageUrl, v.id);
  });

  return imgs;
};

// ─── Parse "S,M,L" hoặc "Blue,Red" → array ─────────────────────────────────
const parseTokens = (val) =>
  val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];

// ─── Gallery ────────────────────────────────────────────────────────────────
const Gallery = ({ images, activeUrl, onSelect }) => {
  const [mainIdx, setMainIdx] = useState(0);

  // Khi activeUrl thay đổi (chọn variant) → scroll gallery đến ảnh đó
  useEffect(() => {
    if (!activeUrl) return;
    const idx = images.findIndex((img) => img.url === activeUrl);
    if (idx >= 0) setMainIdx(idx);
  }, [activeUrl, images]);

  const current = images[mainIdx] || {};

  const prev = () => setMainIdx((i) => Math.max(0, i - 1));
  const next = () => setMainIdx((i) => Math.min(images.length - 1, i + 1));

  return (
    <div className="flex gap-4">
      {/* Thumbnail column */}
      <div className="flex flex-col gap-2 w-16 max-h-[520px] overflow-y-auto scrollbar-thin">
        {images.map((img, idx) => (
          <button
            key={img.url}
            onClick={() => { setMainIdx(idx); onSelect(img); }}
            className={clsx(
              'w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all',
              mainIdx === idx
                ? 'border-emerald-500 ring-2 ring-emerald-200'
                : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100',
            )}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.url}
            src={current.url || 'https://via.placeholder.com/600x600?text=No+Image'}
            alt="product"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={mainIdx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              disabled={mainIdx === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setMainIdx(idx)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  mainIdx === idx ? 'bg-emerald-500 w-4' : 'bg-white/70',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct]               = useState(null);
  const [related, setRelated]               = useState([]);
  const [quantity, setQuantity]             = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor]     = useState(null);
  const [selectedSize, setSelectedSize]       = useState(null);
  const [activeTab, setActiveTab]           = useState('description');
  const [loading, setLoading]               = useState(true);
  // URL ảnh đang active (để Gallery scroll đến đúng chỗ)
  const [activeImageUrl, setActiveImageUrl] = useState(null);

  const { addToCart, isInCart }     = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setSelectedVariant(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setActiveImageUrl(null);

    productService
      .getById(id)
      .then((data) => {
        setProduct(normalize(data));
        // Chọn variant đầu tiên mặc định
        const firstVariant = data.variants?.[0] || null;
        setSelectedVariant(firstVariant);
        // Init color/size từ variant đầu hoặc từ product
        const initColor = firstVariant?.color || parseTokens(data.color)[0] || null;
        const initSize  = firstVariant?.size  || parseTokens(data.size)[0]  || null;
        setSelectedColor(initColor);
        setSelectedSize(initSize);
        // Ảnh active ban đầu = ảnh variant đầu hoặc ảnh product
        setActiveImageUrl(firstVariant?.imageUrl || data.imageUrl || data.images?.[0]?.url || null);
        return productService.getRelated(id, 4);
      })
      .then((rel) => setRelated(normalizeProducts(rel || [])))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Tất cả ảnh xây từ product
  const allImages = buildAllImages(product);

  // Khi bấm vào ảnh trong Gallery → tự động select variant tương ứng
  const handleGallerySelect = useCallback(
    (img) => {
      setActiveImageUrl(img.url);
      if (img.variantId) {
        const matched = product?.variants?.find((v) => v.id === img.variantId);
        if (matched) { setSelectedVariant(matched); setQuantity(1); }
      }
    },
    [product],
  );

  // Bấm chọn variant → cập nhật ảnh active
  const handleSelectVariant = useCallback((variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
    if (variant?.color) setSelectedColor(variant.color);
    if (variant?.size)  setSelectedSize(variant.size);
    if (variant?.imageUrl) setActiveImageUrl(variant.imageUrl);
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────
  const inWishlist     = isInWishlist(product?.id);
  const inCart         = isInCart(product?.id);
  const currentStock   = selectedVariant?.availableStock ?? selectedVariant?.stock ?? product?.stock ?? 0;
  const currentPrice   = selectedVariant?.price   ?? product?.price   ?? 0;
  const currentCompare = selectedVariant?.comparePrice ?? product?.originalPrice ?? 0;
  const currentDiscount =
    currentCompare > currentPrice
      ? Math.round(((currentCompare - currentPrice) / currentCompare) * 100)
      : 0;

  // Parse color/size trực tiếp từ product (khi không dùng variants)
  const productColors = parseTokens(product?.color);
  const productSizes  = parseTokens(product?.size);

  // Group variants theo color để render đẹp (Shopee style)
  const variantsByColor = (product?.variants || []).reduce((acc, v) => {
    const key = v.color || v.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const uniqueColors = Object.keys(variantsByColor);

  // Nếu variant có size → render thêm size selector
  const hasSizes = (product?.variants || []).some((v) => v.size);
  const sizesForColor = selectedVariant?.color
    ? (product?.variants || []).filter((v) => v.color === selectedVariant.color && v.size)
    : [];

  if (loading) return <PageLoader />;
  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-gray-900">Không tìm thấy sản phẩm</p>
        <Link to="/products"><Button>Quay lại sản phẩm</Button></Link>
      </div>
    );

  const handleAddToCart = () => addToCart(product, quantity, selectedVariant?.id);
  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant?.id);
    navigate('/checkout', {
      state: { buyNow: true, productId: product.id, variantId: selectedVariant?.id },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Sản phẩm', to: '/products' },
            { label: product.name, to: `/products/${product.id}` },
          ]}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {allImages.length > 0 ? (
            <Gallery
              images={allImages}
              activeUrl={activeImageUrl}
              onSelect={handleGallerySelect}
            />
          ) : (
            <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Chưa có ảnh</span>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-5"
        >
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.isNew && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">MỚI</span>
            )}
            {product.isBestSeller && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">BÁN CHẠY</span>
            )}
            {currentDiscount > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                -{currentDiscount}% OFF
              </span>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              {product.brand}
            </p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.floor(product.rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  }
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
            <span className="text-sm text-gray-500">
              ({product.reviewCount.toLocaleString()} đánh giá)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-4xl font-black text-gray-900">{formatPrice(currentPrice)}</span>
            {currentCompare > currentPrice && (
              <span className="text-xl text-gray-400 line-through">{formatPrice(currentCompare)}</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed">
            {product.description || product.shortDescription}
          </p>

          {/* ── Variant Selector ── */}
          {(() => {
            // Ưu tiên dữ liệu từ variants nếu có, fallback về product.color/size
            const showVariantColors = uniqueColors.length > 0;
            const showProductColors = !showVariantColors && productColors.length > 0;
            const showVariantSizes  = hasSizes && sizesForColor.length > 0;
            const showProductSizes  = !showVariantSizes && productSizes.length > 0;

            if (!showVariantColors && !showProductColors && !showVariantSizes && !showProductSizes) return null;

            return (
              <div className="space-y-4">
                {/* Color — từ variants */}
                {showVariantColors && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Màu sắc:{' '}
                      <span className="font-normal text-gray-600">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map((colorKey) => {
                        const firstOfColor = variantsByColor[colorKey][0];
                        const isSelected = variantsByColor[colorKey].some((v) => v.id === selectedVariant?.id);
                        return (
                          <button
                            key={colorKey}
                            onClick={() => handleSelectVariant(firstOfColor)}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400',
                            )}
                          >
                            {firstOfColor.imageUrl && (
                              <img src={firstOfColor.imageUrl} alt={colorKey} className="w-6 h-6 rounded object-cover border border-gray-200" />
                            )}
                            {colorKey}
                            {isSelected && <Check size={13} className="text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color — từ product.color string "Blue,Red,..." */}
                {showProductColors && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Màu sắc:{' '}
                      <span className="font-normal text-gray-600">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {productColors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={clsx(
                            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                            selectedColor === c
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400',
                          )}
                        >
                          {c}
                          {selectedColor === c && <Check size={13} className="text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size — từ variants */}
                {showVariantSizes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Kích thước:{' '}
                      <span className="font-normal text-gray-600">{selectedSize}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizesForColor.map((v) => {
                        const outOfStock = !v.isActive || (v.availableStock ?? v.stock ?? 0) === 0;
                        return (
                          <button
                            key={v.id}
                            onClick={() => handleSelectVariant(v)}
                            disabled={outOfStock}
                            className={clsx(
                              'min-w-[48px] px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                              selectedVariant?.id === v.id
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400',
                              outOfStock && 'opacity-40 cursor-not-allowed line-through',
                            )}
                          >
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size — từ product.size string "S,M,L,..." */}
                {showProductSizes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Kích thước:{' '}
                      <span className="font-normal text-gray-600">{selectedSize}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {productSizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={clsx(
                            'min-w-[48px] px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                            selectedSize === s
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400',
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Quantity */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2.5">Số lượng</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className={clsx('text-sm', currentStock > 0 ? 'text-gray-500' : 'text-red-500 font-semibold')}>
                {currentStock > 0 ? `${currentStock} sản phẩm có sẵn` : 'Hết hàng'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="flex-1"
            >
              <ShoppingCart size={18} />
              {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
            </Button>
            <Button
              size="lg"
              fullWidth
              onClick={handleBuyNow}
              disabled={currentStock === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Zap size={18} />
              Mua ngay
            </Button>
            <button
              onClick={() => toggleWishlist(product)}
              className={clsx(
                'w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all',
                inWishlist
                  ? 'border-red-500 bg-red-50 text-red-500'
                  : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-400',
              )}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
            <button className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-16">
        <div className="flex gap-1 border-b border-gray-200 mb-8">
          {['description', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-6 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab === 'description' ? 'Mô tả' : 'Đánh giá'}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-gray-600 leading-relaxed text-base">
              {product.description || 'Chưa có mô tả.'}
            </p>
          </motion.div>
        )}
        {activeTab === 'reviews' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ProductReview product={product} />
          </motion.div>
        )}
      </div>

      {/* ── Related ── */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-8">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;