import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';
import clsx from 'clsx';
import toast from 'react-hot-toast';

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
  const imgs = [];

  const push = (url, variantId = null) => {
    if (!url) return;
    const existing = imgs.find((img) => img.url === url);
    if (existing) {
      if (variantId && !existing.variantId) {
        existing.variantId = variantId;
      }
      return;
    }
    imgs.push({ url, variantId });
  };

  // 1. Ảnh chính của product
  if (product.imageUrl) push(product.imageUrl, null);

  // 2. Ảnh từ bảng product_images
  (product.images || []).forEach((img) => push(img.url, img.variantId || null));

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
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });

  // Khi activeUrl thay đổi (chọn variant) → scroll gallery đến ảnh đó
  useEffect(() => {
    if (!activeUrl) return;
    const idx = images.findIndex((img) => img.url === activeUrl);
    if (idx >= 0) setMainIdx(idx);
  }, [activeUrl, images]);

  const current = images[mainIdx] || {};

  const prev = () => setMainIdx((i) => Math.max(0, i - 1));
  const next = () => setMainIdx((i) => Math.min(images.length - 1, i + 1));

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.5)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    });
  };

  return (
    <div className="flex gap-6">
      {/* Thumbnail column */}
      <div className="flex flex-col gap-3 w-20 max-h-[520px] overflow-y-auto scrollbar-none pr-1">
        {images.map((img, idx) => (
          <button
            key={img.url}
            onClick={() => { setMainIdx(idx); onSelect(img); }}
            className={clsx(
              'w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 shadow-sm',
              mainIdx === idx
                ? 'border-emerald-500 ring-2 ring-emerald-100 scale-105 shadow-md'
                : 'border-gray-200 hover:border-gray-400 hover:scale-102 opacity-70 hover:opacity-100',
            )}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div 
        className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-md group cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.url}
            className="w-full h-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={current.url || 'https://via.placeholder.com/600x600?text=No+Image'}
              alt="product"
              style={zoomStyle}
              className="w-full h-full object-cover transition-transform duration-100 ease-out"
            />
          </motion.div>
        </AnimatePresence>

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={mainIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={next}
              disabled={mainIdx === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setMainIdx(idx)}
                className={clsx(
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  mainIdx === idx ? 'bg-emerald-500 w-6 shadow-sm' : 'bg-white/70 hover:bg-white',
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
  const { trackProductView, trackAddToCart, trackWishlist } = useBehaviorTracker();

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
        const initImg = firstVariant?.imageUrl || data.images?.find((img) => {
          if (img.variantId && firstVariant && Number(img.variantId) === Number(firstVariant.id)) return true;
          if (img.variantId && firstVariant) {
            const v = data.variants?.find((varItem) => Number(varItem.id) === Number(img.variantId));
            return v && v.color && v.color === firstVariant.color;
          }
          return false;
        })?.url || data.imageUrl || data.images?.[0]?.url || null;

        setActiveImageUrl(initImg);
        // Track product view
        if (data.id) {
          trackProductView(data.id);
        }
        return productService.getRelated(id, 4);
      })
      .then((rel) => setRelated(normalizeProducts(rel || [])))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Tất cả ảnh xây từ product
  const allImages = useMemo(() => buildAllImages(product), [product]);

  // Khi bấm vào ảnh trong Gallery → tự động select variant tương ứng
  const handleGallerySelect = useCallback(
    (img) => {
      setActiveImageUrl(img.url);
      // Tìm variant khớp với id hoặc khớp với imageUrl
      const matched = product?.variants?.find(
        (v) => (img.variantId && Number(v.id) === Number(img.variantId)) || (v.imageUrl && v.imageUrl === img.url)
      );
      if (matched) {
        setSelectedVariant(matched);
        if (matched.color) setSelectedColor(matched.color);
        if (matched.size) setSelectedSize(matched.size);
        setQuantity(1);
      }
    },
    [product],
  );

  // Handle matching variant dynamically from color + size matrix
  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) return;

    // Tìm variant khớp cả màu sắc và kích thước
    let matched = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
    
    // Nếu không khớp cả 2, thử tìm variant khớp màu sắc
    if (!matched && selectedColor) {
      matched = product.variants.find((v) => v.color === selectedColor);
    }
    
    // Hoặc thử tìm variant khớp kích thước
    if (!matched && selectedSize) {
      matched = product.variants.find((v) => v.size === selectedSize);
    }

    if (matched) {
      // Cập nhật selectedVariant chỉ khi có sự thay đổi thực sự
      setSelectedVariant((current) => {
        if (!current || current.id !== matched.id) {
          return matched;
        }
        return current;
      });

      // Đồng bộ lại color/size được chọn nếu cần
      if (matched.color && matched.color !== selectedColor) {
        setSelectedColor(matched.color);
      }
      if (matched.size && matched.size !== selectedSize) {
        setSelectedSize(matched.size);
      }

      // Xác định ảnh hiển thị
      const targetImg = matched.imageUrl || product.images?.find((img) => {
        if (img.variantId && Number(img.variantId) === Number(matched.id)) return true;
        if (img.variantId) {
          const v = product.variants.find((varItem) => Number(varItem.id) === Number(img.variantId));
          return v && v.color && v.color === matched.color;
        }
        return false;
      })?.url;

      if (targetImg) {
        setActiveImageUrl(targetImg);
      }
    }
  }, [selectedColor, selectedSize, product]);

  // Handle color/size matrix click
  const handleSelectColor = (color) => {
    setSelectedColor(color);
    setQuantity(1);
  };

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

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

  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
  }, [product]);

  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map((v) => v.size).filter(Boolean))];
  }, [product]);

  const isColorDisabled = useCallback((color) => {
    return !product?.variants?.some(
      (v) => v.color === color && (!selectedSize || v.size === selectedSize) && v.isActive
    );
  }, [product, selectedSize]);

  const isSizeDisabled = useCallback((size) => {
    return !product?.variants?.some(
      (v) => v.size === size && (!selectedColor || v.color === selectedColor) && v.isActive
    );
  }, [product, selectedColor]);

  if (loading) return <PageLoader />;
  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-gray-900">Không tìm thấy sản phẩm</p>
        <Link to="/products"><Button>Quay lại sản phẩm</Button></Link>
      </div>
    );

  const handleAddToCart = () => {
    const isLoggedIn = !!localStorage.getItem('auth_tokens');
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
    addToCart(product, quantity, selectedVariant?.id);
    trackAddToCart(product.id);
  };
  const handleBuyNow = () => {
    const isLoggedIn = !!localStorage.getItem('auth_tokens');
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để mua ngay');
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
    addToCart(product, quantity, selectedVariant?.id);
    trackAddToCart(product.id);
    navigate('/checkout', {
      state: { buyNow: true, productId: product.id, variantId: selectedVariant?.id },
    });
  };
  const handleToggleWishlist = () => {
    toggleWishlist(product);
    trackWishlist(product.id);
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
        <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          {allImages.length > 0 ? (
            <Gallery
              images={allImages}
              activeUrl={activeImageUrl}
              onSelect={handleGallerySelect}
            />
          ) : (
            <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
              <span className="text-gray-400 text-sm">Chưa có ảnh</span>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6"
        >
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.isNew && (
              <span className="px-3.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg tracking-wider shadow-sm">MỚI</span>
            )}
            {product.isBestSeller && (
              <span className="px-3.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg tracking-wider shadow-sm">BÁN CHẠY</span>
            )}
            {currentDiscount > 0 && (
              <span className="px-3.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg tracking-wider shadow-sm">
                -{currentDiscount}% GIẢM
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-1.5">
              {product.brand}
            </p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
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
            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{product.rating}</span>
            <span className="text-sm text-gray-500 font-medium border-l border-gray-200 pl-3">
              {product.reviewCount.toLocaleString()} đánh giá
            </span>
          </div>

          {/* Price with Premium Glassmorphism styling */}
          <div className="flex items-baseline gap-4 bg-gradient-to-r from-emerald-50 to-teal-50/30 border border-emerald-100/50 rounded-2xl px-6 py-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-200/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-4xl font-extrabold text-emerald-700 tracking-tight">{formatPrice(currentPrice)}</span>
            {currentCompare > currentPrice && (
              <span className="text-lg text-gray-400 line-through font-medium">{formatPrice(currentCompare)}</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed text-sm">
            {product.description || product.shortDescription}
          </p>

          {/* ── Variant Selector ── */}
          {(() => {
            const showVariantColors = uniqueColors.length > 0;
            const showProductColors = !showVariantColors && productColors.length > 0;
            const showVariantSizes  = uniqueSizes.length > 0;
            const showProductSizes  = !showVariantSizes && productSizes.length > 0;

            if (!showVariantColors && !showProductColors && !showVariantSizes && !showProductSizes) return null;

            return (
              <div className="space-y-5 border-t border-b border-gray-100 py-5">
                {/* Color — từ variants */}
                {showVariantColors && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                      Màu sắc:{' '}
                      <span className="font-semibold text-emerald-600 normal-case ml-1">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {uniqueColors.map((colorKey) => {
                        const isSelected = selectedColor === colorKey;
                        const disabled = isColorDisabled(colorKey);
                        const firstVariantOfColor = product.variants.find(v => v.color === colorKey);
                        return (
                          <button
                            key={colorKey}
                            onClick={() => handleSelectColor(colorKey)}
                            disabled={disabled}
                            className={clsx(
                              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-300 transform active:scale-95',
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm scale-102'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50',
                              disabled && 'opacity-40 cursor-not-allowed line-through'
                            )}
                          >
                            {firstVariantOfColor?.imageUrl && (
                              <img src={firstVariantOfColor.imageUrl} alt={colorKey} className="w-6 h-6 rounded-lg object-cover border border-gray-200 shadow-sm" />
                            )}
                            {colorKey}
                            {isSelected && <Check size={14} className="text-emerald-600 stroke-[3px]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color — từ product.color fallback */}
                {showProductColors && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                      Màu sắc:{' '}
                      <span className="font-semibold text-emerald-600 normal-case ml-1">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {productColors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={clsx(
                            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-300 transform active:scale-95',
                            selectedColor === c
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm scale-102'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50',
                          )}
                        >
                          {c}
                          {selectedColor === c && <Check size={14} className="text-emerald-600 stroke-[3px]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size — từ variants */}
                {showVariantSizes && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                      Kích thước:{' '}
                      <span className="font-semibold text-emerald-600 normal-case ml-1">{selectedSize}</span>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {uniqueSizes.map((sizeKey) => {
                        const isSelected = selectedSize === sizeKey;
                        const disabled = isSizeDisabled(sizeKey);
                        return (
                          <button
                            key={sizeKey}
                            onClick={() => handleSelectSize(sizeKey)}
                            disabled={disabled}
                            className={clsx(
                              'min-w-[56px] px-4 py-2 rounded-xl text-sm font-bold border-2 text-center transition-all duration-300 transform active:scale-95',
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm scale-102'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50',
                              disabled && 'opacity-40 cursor-not-allowed line-through',
                            )}
                          >
                            {sizeKey}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size — từ product.size fallback */}
                {showProductSizes && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                      Kích thước:{' '}
                      <span className="font-semibold text-emerald-600 normal-case ml-1">{selectedSize}</span>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {productSizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={clsx(
                            'min-w-[56px] px-4 py-2 rounded-xl text-sm font-bold border-2 text-center transition-all duration-300 transform active:scale-95',
                            selectedSize === s
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm scale-102'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50',
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
            <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Số lượng</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden p-0.5 animate-fade-in">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  type="button"
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-950 hover:bg-gray-50 active:scale-95 transition-all rounded-lg"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock}
                  type="button"
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-950 hover:bg-gray-50 active:scale-95 transition-all rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className={clsx('text-xs font-semibold px-3 py-1.5 rounded-lg border shadow-sm transition-all', currentStock > 0 ? 'text-gray-500 bg-gray-50 border-gray-100' : 'text-red-500 bg-red-50 border-red-100')}>
                {currentStock > 0 ? `${currentStock} sản phẩm có sẵn` : 'Hết hàng'}
              </span>
            </div>
          </div>

          {/* Actions with premium custom styles and micro-animations */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all duration-300 shadow-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                inCart 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 hover:shadow shadow-sm active:scale-98"
              )}
            >
              <ShoppingCart size={16} />
              {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
            </motion.button>
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBuyNow}
              disabled={currentStock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Zap size={16} />
              Mua ngay
            </motion.button>
            <button
              onClick={handleToggleWishlist}
              className={clsx(
                'w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 shadow-sm flex-shrink-0',
                inWishlist
                  ? 'border-red-500 bg-red-50 text-red-500 shadow-red-100'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-red-300 hover:text-red-400',
              )}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} className={clsx(inWishlist && "animate-pulse text-red-500")} />
            </button>
            <button className="w-12 h-12 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-300 hover:bg-gray-50 transform hover:-translate-y-0.5 active:scale-95 shadow-sm transition-all duration-300 flex-shrink-0">
              <Share2 size={16} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Tabs with Framer Motion Sliding Underline ── */}
      <div className="mb-16">
        <div className="flex gap-1 border-b border-gray-200 mb-8 relative">
          {['description', 'reviews'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-6 py-4 text-sm font-bold capitalize transition-all relative',
                  isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {tab === 'description' ? 'Mô tả chi tiết' : `Đánh giá khách hàng (${product.reviewCount})`}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'description' ? (
            <motion.div 
              key="description"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm leading-relaxed text-gray-600 text-sm"
            >
              {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
            </motion.div>
          ) : (
            <motion.div 
              key="reviews"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProductReview product={product} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Related ── */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-8">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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